const { Wallet, WalletTransaction, User, Level, Loan, Repayment, LoanPayment } = require('../models');
const { updateLevelProgress } = require('../utils/levelUtils');

class WalletService {
  
  /**
   * Get or create wallet for user
   */
  static async getOrCreateWallet(userId) {
    let wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      wallet = new Wallet({ userId });
      await wallet.save();
    }
    
    return wallet;
  }

  /**
   * Get wallet balance
   */
  static async getBalance(userId) {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet.balance;
  }

  /**
   * Add funds to wallet (simulation)
   */
  static async addFunds(userId, amount, description = 'Wallet top-up', reference = null) {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const wallet = await this.getOrCreateWallet(userId);
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    // Create transaction record
    const transaction = new WalletTransaction({
      userId,
      walletId: wallet._id,
      type: 'deposit',
      amount,
      balanceBefore,
      balanceAfter,
      description,
      reference,
      status: 'completed'
    });

    // Update wallet
    wallet.balance = balanceAfter;
    wallet.totalDeposited += amount;
    wallet.updatedAt = new Date();

    // Save both in transaction
    await Promise.all([
      wallet.save(),
      transaction.save()
    ]);

    return {
      transaction,
      newBalance: balanceAfter,
      wallet
    };
  }

  /**
   * Withdraw funds from wallet (simulation)
   */
  static async withdrawFunds(userId, amount, description = 'Wallet withdrawal', reference = null) {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const wallet = await this.getOrCreateWallet(userId);
    
    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;

    // Create transaction record
    const transaction = new WalletTransaction({
      userId,
      walletId: wallet._id,
      type: 'withdrawal',
      amount,
      balanceBefore,
      balanceAfter,
      description,
      reference,
      status: 'completed'
    });

    // Update wallet
    wallet.balance = balanceAfter;
    wallet.totalWithdrawn += amount;
    wallet.updatedAt = new Date();

    // Save both
    await Promise.all([
      wallet.save(),
      transaction.save()
    ]);

    return {
      transaction,
      newBalance: balanceAfter,
      wallet
    };
  }

  /**
   * Pay loan repayment from wallet
   */
  static async payLoanRepayment(userId, repaymentId, amount = null) {
    // Get repayment details
    const repayment = await Repayment.findById(repaymentId).populate('loanId');
    if (!repayment) {
      throw new Error('Repayment not found');
    }

    // Verify ownership
    if (repayment.loanId.userId.toString() !== userId.toString()) {
      throw new Error('Unauthorized: Not your loan');
    }

    // Check if already paid
    if (repayment.status === 'paid') {
      throw new Error('Repayment already completed');
    }

    // Use repayment amount if not specified
    const paymentAmount = amount || repayment.amount;
    
    if (paymentAmount <= 0) {
      throw new Error('Invalid payment amount');
    }

    const wallet = await this.getOrCreateWallet(userId);
    
    if (wallet.balance < paymentAmount) {
      throw new Error('Insufficient wallet balance');
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - paymentAmount;
    const isEarlyPayment = new Date() < repayment.dueDate;

    // Create wallet transaction
    const transaction = new WalletTransaction({
      userId,
      walletId: wallet._id,
      type: 'loan_payment',
      amount: paymentAmount,
      balanceBefore,
      balanceAfter,
      description: `Loan payment for ${repayment.loanId.amount} loan`,
      relatedLoanId: repayment.loanId._id,
      relatedRepaymentId: repayment._id,
      status: 'completed'
    });

    // Create loan payment record
    const loanPayment = new LoanPayment({
      loanId: repayment.loanId._id,
      repaymentId: repayment._id,
      walletTransactionId: transaction._id,
      amount: paymentAmount,
      paymentMethod: 'wallet',
      isEarlyPayment,
      paidAt: new Date()
    });

    // Update repayment status
    repayment.paidAt = new Date();
    repayment.status = 'paid';

    // Update wallet
    wallet.balance = balanceAfter;
    wallet.totalLoanPayments += paymentAmount;
    wallet.updatedAt = new Date();

    // Check if loan is fully paid
    const allRepayments = await Repayment.find({ loanId: repayment.loanId._id });
    const allPaid = allRepayments.every(r => r._id.equals(repayment._id) || r.status === 'paid');
    
    let levelUpdate = null;
    if (allPaid) {
      // Mark loan as completed
      repayment.loanId.status = 'completed';
      repayment.loanId.completedAt = new Date();
      
      // Update level progress
      levelUpdate = await updateLevelProgress(userId, isEarlyPayment ? 'early' : 'ontime');
      loanPayment.levelProgressAwarded = true;
    }

    // Save all changes
    await Promise.all([
      wallet.save(),
      transaction.save(),
      loanPayment.save(),
      repayment.save(),
      repayment.loanId.save()
    ]);

    return {
      transaction,
      loanPayment,
      repayment,
      newBalance: balanceAfter,
      levelUpdate,
      loanCompleted: allPaid
    };
  }

  /**
   * Disburse loan to wallet
   */
  static async disburseLoan(userId, loanId, amount) {
    const wallet = await this.getOrCreateWallet(userId);
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    // Create transaction record
    const transaction = new WalletTransaction({
      userId,
      walletId: wallet._id,
      type: 'loan_disbursement',
      amount,
      balanceBefore,
      balanceAfter,
      description: `Loan disbursement - ₱${amount}`,
      relatedLoanId: loanId,
      status: 'completed'
    });

    // Update wallet
    wallet.balance = balanceAfter;
    wallet.updatedAt = new Date();

    // Save both
    await Promise.all([
      wallet.save(),
      transaction.save()
    ]);

    return {
      transaction,
      newBalance: balanceAfter,
      wallet
    };
  }

  /**
   * Get wallet transaction history
   */
  static async getTransactionHistory(userId, limit = 50, offset = 0) {
    const transactions = await WalletTransaction.find({ userId })
      .populate('relatedLoanId', 'amount status')
      .populate('relatedRepaymentId', 'dueDate amount')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const total = await WalletTransaction.countDocuments({ userId });

    return {
      transactions,
      total,
      hasMore: (offset + limit) < total
    };
  }

  /**
   * Get wallet summary
   */
  static async getWalletSummary(userId) {
    const wallet = await this.getOrCreateWallet(userId);
    
    // Get recent transactions
    const recentTransactions = await WalletTransaction.find({ userId })
      .populate('relatedLoanId', 'amount status')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get pending repayments
    const pendingRepayments = await Repayment.find({
      status: 'pending'
    }).populate({
      path: 'loanId',
      match: { userId, status: 'active' },
      select: 'amount status'
    }).sort({ dueDate: 1 });

    const validPendingRepayments = pendingRepayments.filter(r => r.loanId);

    return {
      wallet,
      recentTransactions,
      pendingRepayments: validPendingRepayments,
      summary: {
        currentBalance: wallet.balance,
        totalDeposited: wallet.totalDeposited,
        totalWithdrawn: wallet.totalWithdrawn,
        totalLoanPayments: wallet.totalLoanPayments,
        canPayAll: validPendingRepayments.length > 0 ? 
          wallet.balance >= validPendingRepayments.reduce((sum, r) => sum + r.amount, 0) : true
      }
    };
  }
}

module.exports = WalletService;