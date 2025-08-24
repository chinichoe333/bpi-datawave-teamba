const express = require('express');
const router = express.Router();
const WalletService = require('../services/walletService');
const { authenticateToken, requireBorrower } = require('../middleware/auth');
const { getLevelInfo } = require('../utils/levelUtils');

// All wallet routes require authentication
router.use(authenticateToken);
router.use(requireBorrower);

/**
 * GET /api/wallet - Get wallet summary
 */
router.get('/', async (req, res) => {
  try {
    const walletSummary = await WalletService.getWalletSummary(req.user._id);
    const levelInfo = await getLevelInfo(req.user._id);
    
    res.json({
      success: true,
      data: {
        ...walletSummary,
        levelInfo
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet information'
    });
  }
});

/**
 * GET /api/wallet/balance - Get current balance
 */
router.get('/balance', async (req, res) => {
  try {
    const balance = await WalletService.getBalance(req.user._id);
    
    res.json({
      success: true,
      data: { balance }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch balance'
    });
  }
});

/**
 * POST /api/wallet/add-funds - Add funds to wallet (simulation)
 */
router.post('/add-funds', async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    if (amount > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Maximum deposit amount is ₱50,000'
      });
    }

    const result = await WalletService.addFunds(
      req.user._id,
      amount,
      description || `Wallet top-up - ₱${amount}`,
      `SIM-${Date.now()}` // Simulation reference
    );
    
    res.json({
      success: true,
      message: `Successfully added ₱${amount} to your wallet`,
      data: {
        transaction: result.transaction,
        newBalance: result.newBalance
      }
    });
  } catch (error) {
    console.error('Add funds error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to add funds'
    });
  }
});

/**
 * POST /api/wallet/withdraw - Withdraw funds from wallet (simulation)
 */
router.post('/withdraw', async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    const result = await WalletService.withdrawFunds(
      req.user._id,
      amount,
      description || `Wallet withdrawal - ₱${amount}`,
      `SIM-WD-${Date.now()}` // Simulation reference
    );
    
    res.json({
      success: true,
      message: `Successfully withdrew ₱${amount} from your wallet`,
      data: {
        transaction: result.transaction,
        newBalance: result.newBalance
      }
    });
  } catch (error) {
    console.error('Withdraw funds error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to withdraw funds'
    });
  }
});

/**
 * POST /api/wallet/pay-loan - Pay loan repayment from wallet
 */
router.post('/pay-loan', async (req, res) => {
  try {
    const { repaymentId, amount } = req.body;
    
    if (!repaymentId) {
      return res.status(400).json({
        success: false,
        error: 'Repayment ID is required'
      });
    }

    const result = await WalletService.payLoanRepayment(
      req.user._id,
      repaymentId,
      amount
    );
    
    let message = `Payment of ₱${result.loanPayment.amount} successful`;
    if (result.loanCompleted) {
      message += '. Loan completed!';
    }
    if (result.levelUpdate?.levelChanged) {
      message += ` Congratulations! You've reached ${result.levelUpdate.levelName} (Level ${result.levelUpdate.newLevel})!`;
    }
    
    res.json({
      success: true,
      message,
      data: {
        transaction: result.transaction,
        loanPayment: result.loanPayment,
        newBalance: result.newBalance,
        loanCompleted: result.loanCompleted,
        levelUpdate: result.levelUpdate
      }
    });
  } catch (error) {
    console.error('Pay loan error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to process payment'
    });
  }
});

/**
 * GET /api/wallet/transactions - Get transaction history
 */
router.get('/transactions', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await WalletService.getTransactionHistory(req.user._id, limit, offset);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction history'
    });
  }
});

/**
 * POST /api/wallet/simulate-funds - Quick simulation funds (dev helper)
 */
router.post('/simulate-funds', async (req, res) => {
  try {
    // Add ₱10,000 for testing
    const result = await WalletService.addFunds(
      req.user._id,
      10000,
      'Simulation funds for testing',
      `SIM-TEST-${Date.now()}`
    );
    
    res.json({
      success: true,
      message: 'Added ₱10,000 simulation funds',
      data: {
        transaction: result.transaction,
        newBalance: result.newBalance
      }
    });
  } catch (error) {
    console.error('Simulate funds error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to add simulation funds'
    });
  }
});

/**
 * POST /api/wallet/simulate-level-up - Simulate level progression (demo helper)
 */
router.post('/simulate-level-up', async (req, res) => {
  try {
    const { Level } = require('../models');
    const { updateLevelProgress } = require('../utils/levelUtils');
    
    // Get current level
    const currentLevel = await Level.findOne({ userId: req.user._id });
    if (!currentLevel) {
      return res.status(404).json({
        success: false,
        error: 'Level record not found'
      });
    }

    // Simulate multiple on-time payments to trigger level up
    let levelUpdate = null;
    let paymentsSimulated = 0;
    
    // Add payments until level up or max attempts
    for (let i = 0; i < 5; i++) {
      levelUpdate = await updateLevelProgress(req.user._id, 'ontime');
      paymentsSimulated++;
      
      if (levelUpdate.levelChanged) {
        break;
      }
    }
    
    res.json({
      success: true,
      message: levelUpdate.levelChanged 
        ? `Level up! You've reached ${levelUpdate.levelName}!`
        : `Simulated ${paymentsSimulated} payments. ${levelUpdate.nextLevelRequirement - levelUpdate.currentStreak} more needed to level up.`,
      data: {
        levelUpdate,
        paymentsSimulated,
        levelChanged: levelUpdate.levelChanged
      }
    });
  } catch (error) {
    console.error('Simulate level up error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to simulate level up'
    });
  }
});

module.exports = router;