import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { walletAPI } from '../utils/api'
import { 
  Wallet as WalletIcon, 
  Plus, 
  Minus, 
  CreditCard, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Trophy,
  Star
} from 'lucide-react'

const Wallet = () => {
  const { user } = useAuth()
  const [walletData, setWalletData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [amount, setAmount] = useState('')

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    try {
      const response = await walletAPI.getWallet()
      
      if (response.data.success) {
        setWalletData(response.data.data)
      } else {
        toast.error('Failed to load wallet data')
      }
    } catch (error) {
      console.error('Wallet fetch error:', error)
      toast.error('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFunds = async (e) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setActionLoading(true)
    try {
      const response = await walletAPI.addFunds(parseFloat(amount), `Wallet top-up - ₱${amount}`)
      
      if (response.data.success) {
        toast.success(response.data.message)
        setAmount('')
        setShowAddFunds(false)
        fetchWalletData()
      } else {
        toast.error(response.data.error)
      }
    } catch (error) {
      console.error('Add funds error:', error)
      toast.error('Failed to add funds')
    } finally {
      setActionLoading(false)
    }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setActionLoading(true)
    try {
      const response = await walletAPI.withdraw(parseFloat(amount), `Wallet withdrawal - ₱${amount}`)
      
      if (response.data.success) {
        toast.success(response.data.message)
        setAmount('')
        setShowWithdraw(false)
        fetchWalletData()
      } else {
        toast.error(response.data.error)
      }
    } catch (error) {
      console.error('Withdraw error:', error)
      toast.error('Failed to withdraw funds')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePayLoan = async (repaymentId, paymentAmount) => {
    setActionLoading(true)
    try {
      const response = await walletAPI.payLoan(repaymentId, paymentAmount)
      
      if (response.data.success) {
        toast.success(response.data.message)
        fetchWalletData()
      } else {
        toast.error(response.data.error)
      }
    } catch (error) {
      console.error('Pay loan error:', error)
      toast.error('Failed to process payment')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSimulateFunds = async () => {
    setActionLoading(true)
    try {
      const response = await walletAPI.simulateFunds()
      
      if (response.data.success) {
        toast.success(response.data.message)
        fetchWalletData()
      } else {
        toast.error(response.data.error)
      }
    } catch (error) {
      console.error('Simulate funds error:', error)
      toast.error('Failed to add simulation funds')
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return <Plus className="w-4 h-4 text-success-600" />
      case 'withdrawal': return <Minus className="w-4 h-4 text-warning-600" />
      case 'loan_payment': return <CreditCard className="w-4 h-4 text-primary-600" />
      case 'loan_disbursement': return <TrendingUp className="w-4 h-4 text-success-600" />
      default: return <WalletIcon className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!walletData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Unavailable</h2>
          <p className="text-gray-600">Unable to load wallet information</p>
        </div>
      </div>
    )
  }

  const { wallet, recentTransactions, pendingRepayments, summary, levelInfo } = walletData

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold gradient-text mb-2">Digital Wallet</h1>
          <p className="text-gray-600">Manage your funds and loan payments</p>
        </div>

        {/* Balance Card */}
        <div className="card p-8 mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                <WalletIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Current Balance</h2>
                <p className="text-sm text-gray-600">Available funds</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold gradient-text">
                {formatCurrency(wallet.balance)}
              </div>
              <p className="text-sm text-gray-600">PHP</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowAddFunds(true)}
              className="btn-primary flex items-center"
              disabled={actionLoading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Funds
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="btn-secondary flex items-center"
              disabled={actionLoading || wallet.balance <= 0}
            >
              <Minus className="w-4 h-4 mr-2" />
              Withdraw
            </button>
            <button
              onClick={handleSimulateFunds}
              className="btn-secondary flex items-center"
              disabled={actionLoading}
            >
              <Star className="w-4 h-4 mr-2" />
              Add Demo Funds
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Level Progress */}
          {levelInfo && (
            <div className="lg:col-span-1">
              <div className="card p-6 animate-slide-up stagger-1">
                <div className="flex items-center mb-4">
                  <Trophy className="w-5 h-5 text-warning-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Level Progress</h3>
                </div>
                
                <div className="text-center mb-4">
                  <div className={`level-badge level-${levelInfo.currentLevel} mx-auto mb-2`}>
                    {levelInfo.currentLevel}
                  </div>
                  <h4 className="font-semibold text-gray-900">{levelInfo.levelName}</h4>
                  <p className="text-sm text-gray-600">Current Limit: {formatCurrency(levelInfo.currentCap)}</p>
                </div>

                {!levelInfo.isMaxLevel && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress to {levelInfo.nextLevelName}</span>
                      <span>{levelInfo.streak}/{levelInfo.paymentsNeeded + levelInfo.streak}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${levelInfo.progressPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {levelInfo.paymentsNeeded} more on-time payments needed
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">Current Perks:</h5>
                  {levelInfo.currentPerks.map((perk, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-3 h-3 text-success-500 mr-2 flex-shrink-0" />
                      {perk}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pending Payments */}
          <div className="lg:col-span-2">
            {pendingRepayments.length > 0 && (
              <div className="card p-6 mb-6 animate-slide-up stagger-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-warning-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Pending Payments</h3>
                  </div>
                  <span className="badge badge-warning">{pendingRepayments.length} due</span>
                </div>

                <div className="space-y-3">
                  {pendingRepayments.map((repayment) => (
                    <div key={repayment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          Loan Payment - {formatCurrency(repayment.loanId.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Due: {formatDate(repayment.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(repayment.amount)}
                        </span>
                        <button
                          onClick={() => handlePayLoan(repayment._id, repayment.amount)}
                          disabled={actionLoading || wallet.balance < repayment.amount}
                          className="btn-primary text-sm"
                        >
                          {actionLoading ? <LoadingSpinner size="sm" /> : 'Pay Now'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {summary.canPayAll && pendingRepayments.length > 1 && (
                  <div className="mt-4 p-3 bg-success-50 rounded-lg">
                    <p className="text-sm text-success-700">
                      ✅ You have sufficient balance to pay all pending loans
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Recent Transactions */}
            <div className="card p-6 animate-slide-up stagger-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
              
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <WalletIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'deposit' || transaction.type === 'loan_disbursement' 
                            ? 'text-success-600' 
                            : 'text-gray-900'
                        }`}>
                          {transaction.type === 'deposit' || transaction.type === 'loan_disbursement' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Balance: {formatCurrency(transaction.balanceAfter)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Funds Modal */}
        {showAddFunds && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Funds</h3>
              <form onSubmit={handleAddFunds}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (PHP)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input"
                    placeholder="Enter amount"
                    min="1"
                    max="50000"
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum: ₱50,000</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddFunds(false)
                      setAmount('')
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn-primary flex-1"
                  >
                    {actionLoading ? <LoadingSpinner size="sm" /> : 'Add Funds'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdraw && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdraw Funds</h3>
              <form onSubmit={handleWithdraw}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (PHP)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input"
                    placeholder="Enter amount"
                    min="1"
                    max={wallet.balance}
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {formatCurrency(wallet.balance)}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWithdraw(false)
                      setAmount('')
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn-primary flex-1"
                  >
                    {actionLoading ? <LoadingSpinner size="sm" /> : 'Withdraw'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Wallet