import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { borrowerAPI } from '../utils/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  ArrowLeft, 
  Calculator, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Clock
} from 'lucide-react'

const LoanApplication = () => {
  const [digitalId, setDigitalId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [decision, setDecision] = useState(null)
  const navigate = useNavigate()
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      termWeeks: 4
    }
  })

  const amount = watch('amount')
  const termWeeks = watch('termWeeks')

  useEffect(() => {
    fetchDigitalId()
  }, [])

  const fetchDigitalId = async () => {
    try {
      const response = await borrowerAPI.getDigitalId()
      setDigitalId(response.data)
    } catch (error) {
      toast.error('Failed to load profile')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setApplying(true)
    try {
      const response = await borrowerAPI.applyLoan({
        amount: parseInt(data.amount),
        termWeeks: parseInt(data.termWeeks),
        purpose: data.purpose
      })
      
      setDecision(response.data)
      toast.success('Application processed!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Application failed')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!digitalId) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loan Application</h1>
          <p className="text-gray-600">Unable to load your profile. Please try again.</p>
        </div>
      </div>
    )
  }

  // Show decision if application is complete
  if (decision) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="card p-8 text-center">
          <div className="mb-6">
            {decision.decision === 'approve' ? (
              <CheckCircle className="mx-auto text-success-500 mb-4" size={64} />
            ) : decision.decision === 'counter' ? (
              <Clock className="mx-auto text-warning-500 mb-4" size={64} />
            ) : (
              <AlertCircle className="mx-auto text-danger-500 mb-4" size={64} />
            )}
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {decision.decision === 'approve' && 'Congratulations!'}
              {decision.decision === 'counter' && 'Counter Offer'}
              {decision.decision === 'decline' && 'Application Update'}
            </h1>
            
            <p className="text-gray-600">
              {decision.decision === 'approve' && 'Your loan application has been approved.'}
              {decision.decision === 'counter' && 'We have a counter-offer for you.'}
              {decision.decision === 'decline' && 'Your application needs some adjustments.'}
            </p>
          </div>

          {/* Decision Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">Assessment Details</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Risk Band</p>
                <span className={`badge ${
                  decision.pdBand === 'Very Low' || decision.pdBand === 'Low' 
                    ? 'badge-success' 
                    : decision.pdBand === 'Medium' 
                    ? 'badge-warning' 
                    : 'badge-danger'
                }`}>
                  {decision.pdBand}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Assessed At</p>
                <p className="font-medium">{new Date(decision.decidedAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Key Factors</p>
              <ul className="space-y-1">
                {decision.reasons.map((reason, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-primary-500 mr-2">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {decision.counterOffer && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Counter Offer</p>
                <div className="bg-warning-50 border border-warning-200 rounded p-3">
                  <p className="font-medium text-warning-800">
                    ₱{decision.counterOffer.amount.toLocaleString()} for {decision.counterOffer.termWeeks} weeks
                  </p>
                  <p className="text-sm text-warning-700">{decision.counterOffer.reason}</p>
                </div>
              </div>
            )}

            {decision.counterfactualHint && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">How to Improve</p>
                <div className="bg-primary-50 border border-primary-200 rounded p-3">
                  <p className="text-sm text-primary-700">{decision.counterfactualHint}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              Back to Dashboard
            </button>
            {decision.decision === 'approve' && (
              <button
                onClick={() => navigate(`/loans/${decision.loanId}`)}
                className="btn-primary"
              >
                View Loan Details
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const { level } = digitalId
  const weeklyPayment = amount && termWeeks ? (amount / termWeeks).toFixed(2) : 0

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Apply for Loan</h1>
      </div>

      {/* Current Limit Info */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Your Current Limit</h2>
          <div className={`level-badge level-${level.current}`}>
            {level.current}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Available Amount</p>
            <p className="text-2xl font-bold text-primary-600">₱{level.unlockedCap.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Next Level Unlocks</p>
            <p className="text-lg font-semibold text-gray-900">₱{level.nextCap.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Loan Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Amount (₱)
              </label>
              <input
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 100, message: 'Minimum amount is ₱100' },
                  max: { value: level.unlockedCap, message: `Maximum amount is ₱${level.unlockedCap.toLocaleString()}` }
                })}
                type="number"
                min="100"
                max={level.unlockedCap}
                step="50"
                className="input"
                placeholder="Enter amount"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-danger-600">{errors.amount.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Available limit: ₱{level.unlockedCap.toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Term (weeks)
              </label>
              <select
                {...register('termWeeks', { required: 'Term is required' })}
                className="input"
              >
                <option value="2">2 weeks</option>
                <option value="4">4 weeks</option>
                <option value="6">6 weeks</option>
                <option value="8">8 weeks</option>
                <option value="12">12 weeks</option>
              </select>
              {errors.termWeeks && (
                <p className="mt-1 text-sm text-danger-600">{errors.termWeeks.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose of Loan
              </label>
              <select
                {...register('purpose', { required: 'Purpose is required' })}
                className="input"
              >
                <option value="">Select purpose</option>
                <option value="Emergency expenses">Emergency expenses</option>
                <option value="Business capital">Business capital</option>
                <option value="Education">Education</option>
                <option value="Medical bills">Medical bills</option>
                <option value="Home improvement">Home improvement</option>
                <option value="Other">Other</option>
              </select>
              {errors.purpose && (
                <p className="mt-1 text-sm text-danger-600">{errors.purpose.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Calculator */}
        {amount && termWeeks && (
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <Calculator className="text-primary-600 mr-2" size={20} />
              <h3 className="font-semibold text-gray-900">Payment Breakdown</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Weekly Payment</p>
                <p className="text-xl font-bold text-gray-900">₱{weeklyPayment}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Repayment</p>
                <p className="text-xl font-bold text-gray-900">₱{amount}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * This is a simulation with 0% interest for prototype purposes
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={applying}
          className="btn-primary w-full"
        >
          {applying ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner size="sm" className="mr-2" />
              Processing Application...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <TrendingUp size={16} className="mr-2" />
              Submit Application
            </div>
          )}
        </button>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Your application will be processed instantly using our AI assessment system.
            All decisions include detailed explanations and improvement suggestions.
          </p>
        </div>
      </form>
    </div>
  )
}

export default LoanApplication