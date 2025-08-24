import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { borrowerAPI } from '../utils/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react'

const LoanDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loan, setLoan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    fetchLoan()
  }, [id])

  const fetchLoan = async () => {
    try {
      const response = await borrowerAPI.getLoan(id)
      setLoan(response.data)
    } catch (error) {
      toast.error('Failed to load loan details')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async () => {
    setMarking(true)
    try {
      const response = await borrowerAPI.markPaid(id)
      toast.success('Payment marked successfully!')
      if (response.data.levelUp) {
        toast.success(`🎉 Level up! You're now Level ${response.data.newLevel}`)
      }
      fetchLoan() // Refresh loan data
    } catch (error) {
      toast.error('Failed to mark payment')
    } finally {
      setMarking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!loan) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loan Not Found</h1>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'badge-success'
      case 'completed': return 'badge-success'
      case 'declined': return 'badge-danger'
      case 'counter_offered': return 'badge-warning'
      case 'applied': return 'badge-warning'
      default: return 'badge-secondary'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return CheckCircle
      case 'completed': return CheckCircle
      case 'declined': return AlertCircle
      case 'counter_offered': return Clock
      case 'applied': return Clock
      default: return Clock
    }
  }

  const StatusIcon = getStatusIcon(loan.status)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Loan Details</h1>
      </div>

      {/* Loan Overview */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Loan Overview</h2>
          <div className="flex items-center space-x-2">
            <StatusIcon size={20} className={loan.status === 'completed' || loan.status === 'approved' ? 'text-success-500' : 'text-warning-500'} />
            <span className={`badge ${getStatusColor(loan.status)}`}>
              {loan.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Loan Amount</p>
            <p className="text-2xl font-bold text-gray-900">₱{loan.amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Term</p>
            <p className="text-lg font-semibold text-gray-900">{loan.termWeeks} weeks</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Purpose</p>
            <p className="text-lg font-semibold text-gray-900">{loan.purpose}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-600">Applied At</p>
            <p className="font-medium">{new Date(loan.createdAt).toLocaleString()}</p>
          </div>
          {loan.approvedAt && (
            <div>
              <p className="text-sm text-gray-600">Approved At</p>
              <p className="font-medium">{new Date(loan.approvedAt).toLocaleString()}</p>
            </div>
          )}
          {loan.completedAt && (
            <div>
              <p className="text-sm text-gray-600">Completed At</p>
              <p className="font-medium">{new Date(loan.completedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Decision Details */}
      {loan.decision && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Decision Details</h3>
          
          <div className="grid md:grid-cols-2 gap-6 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Decision</p>
              <span className={`badge text-lg px-4 py-2 ${
                loan.decision.decision === 'approve' ? 'badge-success' : 
                loan.decision.decision === 'counter' ? 'badge-warning' : 'badge-danger'
              }`}>
                {loan.decision.decision.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Decided At</p>
              <p className="font-medium">{new Date(loan.decision.decidedAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Decision Factors</p>
            <ul className="space-y-1">
              {loan.decision.reasons.map((reason, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {loan.decision.overrideNote && (
            <div className="bg-warning-50 border border-warning-200 rounded p-3">
              <p className="text-sm font-medium text-warning-800">Admin Override</p>
              <p className="text-sm text-warning-700">{loan.decision.overrideNote}</p>
            </div>
          )}
        </div>
      )}

      {/* Risk Assessment */}
      {loan.riskScore && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
          
          <div className="grid md:grid-cols-2 gap-6 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Risk Band</p>
              <span className={`badge text-lg px-4 py-2 ${
                loan.riskScore.pdBand === 'Very Low' || loan.riskScore.pdBand === 'Low' 
                  ? 'badge-success' 
                  : loan.riskScore.pdBand === 'Medium' 
                  ? 'badge-warning' 
                  : 'badge-danger'
              }`}>
                {loan.riskScore.pdBand}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Risk Score</p>
              <p className="font-mono text-lg font-semibold text-gray-900">{loan.riskScore.pd}</p>
            </div>
          </div>

          {loan.riskScore.counterfactualHint && (
            <div className="bg-primary-50 border border-primary-200 rounded p-3">
              <p className="text-sm font-medium text-primary-800">Improvement Suggestion</p>
              <p className="text-sm text-primary-700">{loan.riskScore.counterfactualHint}</p>
            </div>
          )}
        </div>
      )}

      {/* Counter Offer */}
      {loan.counterOffer && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Counter Offer</h3>
          <div className="bg-warning-50 border border-warning-200 rounded p-4">
            <div className="grid md:grid-cols-2 gap-4 mb-2">
              <div>
                <p className="text-sm text-warning-700">Offered Amount</p>
                <p className="text-xl font-bold text-warning-800">₱{loan.counterOffer.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-warning-700">Offered Term</p>
                <p className="text-lg font-semibold text-warning-800">{loan.counterOffer.termWeeks} weeks</p>
              </div>
            </div>
            <p className="text-sm text-warning-700">{loan.counterOffer.reason}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      {loan.status === 'approved' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Repayment</h3>
          <div className="bg-success-50 border border-success-200 rounded p-4 mb-4">
            <p className="text-sm text-success-700 mb-2">
              This is a simulation. Click below to mark this loan as paid and progress to the next level.
            </p>
            <p className="text-xs text-success-600">
              In a real system, this would be connected to payment processing.
            </p>
          </div>
          
          <button
            onClick={handleMarkPaid}
            disabled={marking}
            className="btn-primary"
          >
            {marking ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center">
                <CheckCircle size={16} className="mr-2" />
                Mark as Paid
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default LoanDetails