import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { borrowerAPI } from '../utils/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  CreditCard, 
  TrendingUp, 
  Award, 
  Plus,
  ArrowRight,
  Target,
  Clock
} from 'lucide-react'

const Dashboard = () => {
  const [digitalId, setDigitalId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDigitalId()
  }, [])

  const fetchDigitalId = async () => {
    try {
      const response = await borrowerAPI.getDigitalId()
      setDigitalId(response.data)
    } catch (error) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <p className="text-gray-600">Unable to load your profile. Please try again.</p>
        </div>
      </div>
    )
  }

  const { level, progress, reliability, lastDecision, actionsToLevelUp } = digitalId

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Welcome back, {digitalId.name}!</h1>
          <p className="text-gray-600 mt-2 text-lg">LiwaywAI ID: <span className="font-mono font-semibold">{digitalId.liwaywaiId}</span></p>
        </div>
        <Link to="/apply" className="btn-primary group">
          <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform duration-200" />
          Apply for Loan
        </Link>
      </div>

      {/* Level Card */}
      <div className="card p-8 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Level</h2>
          <div className={`level-badge level-${level.current}`}>
            {level.current}
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Current Limit</p>
            <p className="text-3xl font-bold text-gray-900">₱{level.unlockedCap.toLocaleString()}</p>
            <div className="w-16 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full mx-auto mt-2"></div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Next Limit</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">₱{level.nextCap.toLocaleString()}</p>
            <div className="w-16 h-1 bg-gradient-to-r from-primary-400 to-indigo-400 rounded-full mx-auto mt-2"></div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Progress to Next Level</p>
            <div className="flex items-center space-x-3 mb-2">
              <div className="progress-bar flex-1 h-3 bg-gray-200">
                <div 
                  className="h-3 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="text-lg font-bold text-primary-600">{progress.percentage}%</span>
            </div>
            <p className="text-sm text-gray-500">
              {progress.completed} of {progress.required} payments completed
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {/* Reliability */}
        <div className="card p-6 group hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-lg">Reliability</h3>
            <div className="p-3 bg-success-100 rounded-xl group-hover:bg-success-200 transition-colors duration-300">
              <Award className="text-success-600" size={24} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">On-time Rate</span>
              <span className="font-medium text-success-600">{reliability.onTimeRate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Loans</span>
              <span className="font-medium">{reliability.totalLoans}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current Streak</span>
              <span className="font-medium text-primary-600">{reliability.streak}</span>
            </div>
          </div>
        </div>

        {/* Last Decision */}
        <div className="card p-6 group hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-lg">Last Assessment</h3>
            <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors duration-300">
              <TrendingUp className="text-primary-600" size={24} />
            </div>
          </div>
          {lastDecision ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Risk Band</span>
                <span className={`badge ${
                  lastDecision.pdBand === 'Very Low' || lastDecision.pdBand === 'Low' 
                    ? 'badge-success' 
                    : lastDecision.pdBand === 'Medium' 
                    ? 'badge-warning' 
                    : 'badge-danger'
                }`}>
                  {lastDecision.pdBand}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Key Factors</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  {lastDecision.reasons.slice(0, 2).map((reason, index) => (
                    <li key={index}>• {reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent assessments</p>
          )}
        </div>

        {/* Next Steps */}
        <div className="card p-6 group hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-lg">Next Steps</h3>
            <div className="p-3 bg-warning-100 rounded-xl group-hover:bg-warning-200 transition-colors duration-300">
              <Target className="text-warning-600" size={24} />
            </div>
          </div>
          <div className="space-y-3">
            {actionsToLevelUp.map((action, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Link 
            to="/digital-id" 
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="text-primary-600" size={20} />
              <span className="font-medium text-gray-900">View Digital ID</span>
            </div>
            <ArrowRight size={16} className="text-gray-400" />
          </Link>
          
          <Link 
            to="/apply" 
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Plus className="text-primary-600" size={20} />
              <span className="font-medium text-gray-900">Apply for Loan</span>
            </div>
            <ArrowRight size={16} className="text-gray-400" />
          </Link>
          
          <Link 
            to="/shares" 
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <TrendingUp className="text-primary-600" size={20} />
              <span className="font-medium text-gray-900">Share History</span>
            </div>
            <ArrowRight size={16} className="text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard