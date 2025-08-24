import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'
import GetStarted from './GetStarted'
import { walletAPI } from '../utils/api'
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  Trophy, 
  Star,
  TrendingUp,
  Zap,
  Gift
} from 'lucide-react'

const LoanPayments = () => {
  const [walletData, setWalletData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [showLevelUpModal, setShowLevelUpModal] = useState(false)
  const [levelUpData, setLevelUpData] = useState(null)

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    try {
      const response = await walletAPI.getWallet()
      
      if (response.data.success) {
        setWalletData(response.data.data)
      } else {
        toast.error('Failed to load payment data')
      }
    } catch (error) {
      console.error('Wallet fetch error:', error)
      toast.error('Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }

  const handlePayLoan = async (repaymentId, paymentAmount) => {
    setPaymentLoading(true)
    try {
      const response = await walletAPI.payLoan(repaymentId, paymentAmount)
      
      if (response.data.success) {
        // Check if user leveled up
        if (response.data.data.levelUpdate?.levelChanged) {
          setLevelUpData(response.data.data.levelUpdate)
          setShowLevelUpModal(true)
        } else {
          toast.success(response.data.message)
        }
        
        // Refresh data
        fetchWalletData()
      } else {
        toast.error(response.data.error)
      }
    } catch (error) {
      console.error('Pay loan error:', error)
      toast.error('Failed to process payment')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handlePayAllLoans = async () => {
    if (!walletData?.pendingRepayments?.length) return
    
    setPaymentLoading(true)
    let levelUpOccurred = false
    let finalLevelData = null
    
    try {
      // Pay all loans sequentially to track level changes
      for (const repayment of walletData.pendingRepayments) {
        const response = await walletAPI.payLoan(repayment._id, repayment.amount)
        
        if (response.data.success && response.data.data.levelUpdate?.levelChanged) {
          levelUpOccurred = true
          finalLevelData = response.data.data.levelUpdate
        }
      }
      
      if (levelUpOccurred && finalLevelData) {
        setLevelUpData(finalLevelData)
        setShowLevelUpModal(true)
      } else {
        toast.success('All payments completed successfully!')
      }
      
      // Refresh data
      fetchWalletData()
    } catch (error) {
      console.error('Pay all loans error:', error)
      toast.error('Failed to process payments')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleSimulateLevelUp = async () => {
    setPaymentLoading(true)
    try {
      const response = await walletAPI.simulateLevelUp()
      
      if (response.data.success) {
        if (response.data.data.levelChanged) {
          setLevelUpData(response.data.data.levelUpdate)
          setShowLevelUpModal(true)
        } else {
          toast.success(response.data.message)
        }
        
        // Refresh data
        fetchWalletData()
      } else {
        toast.error(response.data.error)
      }
    } catch (error) {
      console.error('Simulate level up error:', error)
      toast.error('Failed to simulate level up')
    } finally {
      setPaymentLoading(false)
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!walletData) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load payment information</p>
        </div>
      </div>
    )
  }

  const { wallet, pendingRepayments, summary, levelInfo } = walletData
  const totalPending = pendingRepayments.reduce((sum, r) => sum + r.amount, 0)

  // Show GetStarted component for new users with no loans
  const isNewUser = levelInfo?.currentLevel === 0 && levelInfo?.totalLoans === 0 && pendingRepayments.length === 0

  if (isNewUser) {
    return (
      <GetStarted onLoanCreated={() => fetchWalletData()} />
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Payment Overview */}
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Loan Payments</h3>
                <p className="text-gray-600">Manage your active loan repayments</p>
              </div>
            </div>
            {pendingRepayments.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Pending</p>
                <p className="text-2xl font-bold gradient-text">{formatCurrency(totalPending)}</p>
              </div>
            )}
          </div>

          {/* Wallet Balance Check */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Wallet Balance</p>
                  <p className="text-sm text-gray-600">Available for payments</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{formatCurrency(wallet.balance)}</p>
                <p className={`text-sm ${summary.canPayAll ? 'text-success-600' : 'text-warning-600'}`}>
                  {summary.canPayAll ? '✅ Sufficient funds' : '⚠️ Insufficient funds'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {pendingRepayments.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={handlePayAllLoans}
                disabled={paymentLoading || !summary.canPayAll}
                className="btn-primary flex items-center disabled:opacity-50"
              >
                {paymentLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                Pay All Loans
              </button>
              <button
                onClick={handleSimulateLevelUp}
                disabled={paymentLoading}
                className="btn-secondary flex items-center"
              >
                {paymentLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Trophy className="w-4 h-4 mr-2" />}
                Demo Level Up
              </button>
              <div className="flex items-center text-sm text-gray-600">
                <Gift className="w-4 h-4 mr-1" />
                Earn level progress with each payment!
              </div>
            </div>
          )}
        </div>

        {/* Pending Payments */}
        {pendingRepayments.length > 0 ? (
          <div className="card p-6 animate-slide-up stagger-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Pending Payments</h4>
            <div className="space-y-3">
              {pendingRepayments.map((repayment, index) => (
                <div 
                  key={repayment._id} 
                  className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                    isOverdue(repayment.dueDate) 
                      ? 'border-danger-200 bg-danger-50' 
                      : 'border-gray-200 bg-white hover:border-primary-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h5 className="font-semibold text-gray-900 mr-3">
                          Loan Payment #{index + 1}
                        </h5>
                        {isOverdue(repayment.dueDate) && (
                          <span className="badge badge-danger text-xs">Overdue</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(repayment.amount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Due Date</p>
                          <p className={`font-semibold ${isOverdue(repayment.dueDate) ? 'text-danger-600' : 'text-gray-900'}`}>
                            {formatDate(repayment.dueDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handlePayLoan(repayment._id, repayment.amount)}
                        disabled={paymentLoading || wallet.balance < repayment.amount}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {paymentLoading ? <LoadingSpinner size="sm" /> : 'Pay Now'}
                      </button>
                      {wallet.balance < repayment.amount && (
                        <p className="text-xs text-danger-600 mt-1">Insufficient funds</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-8 animate-slide-up stagger-1">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h4>
              <p className="text-gray-600 mb-4">You have no pending loan payments</p>
              <div className="inline-flex items-center text-sm text-success-600 bg-success-50 px-3 py-2 rounded-lg">
                <Trophy className="w-4 h-4 mr-2" />
                Great job maintaining your payment schedule!
              </div>
            </div>
          </div>
        )}

        {/* Level Progress Showcase */}
        {levelInfo && (
          <div className="card p-6 animate-slide-up stagger-2">
            <div className="flex items-center mb-4">
              <Trophy className="w-5 h-5 text-warning-500 mr-2" />
              <h4 className="text-lg font-semibold text-gray-900">Level Progress</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-center mb-4">
                  <div className={`level-badge level-${levelInfo.currentLevel} mx-auto mb-2`}>
                    {levelInfo.currentLevel}
                  </div>
                  <h5 className="font-semibold text-gray-900">{levelInfo.levelName}</h5>
                  <p className="text-sm text-gray-600">Current Limit: {formatCurrency(levelInfo.currentCap)}</p>
                </div>

                {!levelInfo.isMaxLevel && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress to {levelInfo.nextLevelName}</span>
                      <span>{levelInfo.streak}/{levelInfo.paymentsNeeded + levelInfo.streak}</span>
                    </div>
                    <div className="progress-bar mb-2">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${levelInfo.progressPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {levelInfo.paymentsNeeded} more on-time payments to level up
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h6 className="font-medium text-gray-900 mb-3">Current Perks:</h6>
                <div className="space-y-2">
                  {levelInfo.currentPerks.map((perk, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <Star className="w-3 h-3 text-warning-500 mr-2 flex-shrink-0" />
                      {perk}
                    </div>
                  ))}
                </div>
                
                {levelInfo.nextLevelPerks.length > 0 && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-lg">
                    <h6 className="font-medium text-primary-900 mb-2">Next Level Rewards:</h6>
                    <div className="space-y-1">
                      {levelInfo.nextLevelPerks.slice(0, 2).map((perk, index) => (
                        <div key={index} className="flex items-center text-sm text-primary-700">
                          <Gift className="w-3 h-3 mr-2 flex-shrink-0" />
                          {perk}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Level Up Modal */}
      {showLevelUpModal && levelUpData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 text-center animate-bounce-gentle">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-warning-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold gradient-text mb-2">Level Up!</h3>
              <p className="text-gray-600">Congratulations on your achievement!</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className={`level-badge level-${levelUpData.newLevel - 1} opacity-50`}>
                  {levelUpData.newLevel - 1}
                </div>
                <div className="text-2xl">→</div>
                <div className={`level-badge level-${levelUpData.newLevel} animate-pulse-glow`}>
                  {levelUpData.newLevel}
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">{levelUpData.levelName}</h4>
              <p className="text-gray-600">New Limit: {formatCurrency(levelUpData.newCap)}</p>
            </div>

            {levelUpData.newPerksUnlocked.length > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-success-50 to-emerald-50 rounded-xl">
                <h5 className="font-semibold text-success-900 mb-2">New Perks Unlocked:</h5>
                <div className="space-y-1">
                  {levelUpData.newPerksUnlocked.map((perk, index) => (
                    <div key={index} className="flex items-center text-sm text-success-700">
                      <Star className="w-3 h-3 mr-2 flex-shrink-0" />
                      {perk}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowLevelUpModal(false)}
              className="btn-primary w-full"
            >
              Awesome! Continue
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default LoanPayments