import { useState } from 'react'
import { toast } from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'
import { borrowerAPI } from '../utils/api'
import { 
  Rocket, 
  Gift, 
  Star,
  CheckCircle,
  ArrowRight,
  Zap
} from 'lucide-react'

const GetStarted = ({ onLoanCreated }) => {
  const [loading, setLoading] = useState(false)

  const handleCreateStarterLoan = async () => {
    setLoading(true)
    try {
      const response = await borrowerAPI.getStarterLoan()
      
      if (response.data.success) {
        toast.success(response.data.message)
        if (onLoanCreated) {
          onLoanCreated(response.data.data)
        }
      } else {
        toast.error(response.data.error)
      }
    } catch (error) {
      console.error('Starter loan error:', error)
      toast.error('Failed to create starter loan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-8 text-center animate-slide-up">
      <div className="mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-gentle">
          <Rocket className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold gradient-text mb-2">Welcome to LiwaywAI!</h3>
        <p className="text-gray-600 text-lg">Ready to start your lending journey?</p>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-4 bg-gradient-to-br from-success-50 to-emerald-50 rounded-xl border border-success-200">
            <Gift className="w-8 h-8 text-success-600 mx-auto mb-2" />
            <h4 className="font-semibold text-success-900 mb-1">Starter Loan</h4>
            <p className="text-sm text-success-700">₱300 to get you started</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-200">
            <Zap className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <h4 className="font-semibold text-primary-900 mb-1">Instant Approval</h4>
            <p className="text-sm text-primary-700">No waiting, funds in wallet</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-warning-50 to-orange-50 rounded-xl border border-warning-200">
            <Star className="w-8 h-8 text-warning-600 mx-auto mb-2" />
            <h4 className="font-semibold text-warning-900 mb-1">Build Credit</h4>
            <p className="text-sm text-warning-700">Start your level progression</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">How it works:</h4>
          <div className="space-y-3 text-left">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
              <span className="text-gray-700">Get your ₱300 starter loan instantly</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
              <span className="text-gray-700">Make 4 weekly payments of ₱75 each</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</div>
              <span className="text-gray-700">Level up and unlock higher limits!</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-success-50 to-emerald-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center text-success-700">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Complete your first loan to reach Level 1 and unlock ₱750 limit!</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleCreateStarterLoan}
        disabled={loading}
        className="btn-primary text-lg px-8 py-4 group disabled:transform-none"
      >
        {loading ? (
          <div className="flex items-center">
            <LoadingSpinner size="sm" className="mr-2" />
            Creating your loan...
          </div>
        ) : (
          <div className="flex items-center">
            <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
            Get My Starter Loan
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </button>

      <p className="text-xs text-gray-500 mt-4">
        ⚠️ This is a simulation for demonstration purposes only
      </p>
    </div>
  )
}

export default GetStarted