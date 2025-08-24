import { useState, useEffect } from 'react'
import { adminAPI } from '../../utils/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Clock,
  BarChart3,
  Activity
} from 'lucide-react'

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard()
      setDashboard(response.data)
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

  if (!dashboard) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">Unable to load dashboard data.</p>
        </div>
      </div>
    )
  }

  const { metrics, recentActivity, levelDistribution } = dashboard

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">LiwaywAI Platform Overview</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Borrowers</h3>
            <Users className="text-primary-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalBorrowers}</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Loans</h3>
            <FileText className="text-success-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalLoans}</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Active Loans</h3>
            <TrendingUp className="text-warning-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.activeLoans}</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Pending Applications</h3>
            <Clock className="text-danger-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.pendingApplications}</p>
        </div>
      </div>

      {/* Level Distribution */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <BarChart3 className="text-primary-600 mr-2" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Borrower Level Distribution</h2>
        </div>
        
        <div className="grid grid-cols-11 gap-2">
          {Array.from({ length: 11 }, (_, i) => {
            const levelData = levelDistribution.find(d => d._id === i) || { count: 0 }
            const maxCount = Math.max(...levelDistribution.map(d => d.count))
            const height = maxCount > 0 ? (levelData.count / maxCount) * 100 : 0
            
            return (
              <div key={i} className="text-center">
                <div className="h-32 flex items-end justify-center mb-2">
                  <div 
                    className={`w-8 bg-primary-500 rounded-t level-${i}`}
                    style={{ height: `${height}%`, minHeight: levelData.count > 0 ? '8px' : '0' }}
                  />
                </div>
                <div className="text-xs text-gray-600">L{i}</div>
                <div className="text-sm font-medium text-gray-900">{levelData.count}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Loans */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Activity className="text-success-600 mr-2" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Recent Loan Applications</h3>
          </div>
          
          <div className="space-y-3">
            {recentActivity.loans.length > 0 ? (
              recentActivity.loans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{loan.borrowerEmail}</p>
                    <p className="text-sm text-gray-600">₱{loan.amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${
                      loan.status === 'approved' ? 'badge-success' :
                      loan.status === 'declined' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {loan.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(loan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent loan applications</p>
            )}
          </div>
        </div>

        {/* Recent Shares */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Activity className="text-primary-600 mr-2" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Recent Digital ID Shares</h3>
          </div>
          
          <div className="space-y-3">
            {recentActivity.shares.length > 0 ? (
              recentActivity.shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{share.borrowerEmail}</p>
                    <p className="text-sm text-gray-600">{share.rpLabel}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-wrap gap-1 justify-end mb-1">
                      {share.scopes.slice(0, 2).map((scope) => (
                        <span key={scope} className="badge badge-primary text-xs">
                          {scope.replace('_', ' ')}
                        </span>
                      ))}
                      {share.scopes.length > 2 && (
                        <span className="text-xs text-gray-500">+{share.scopes.length - 2}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(share.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent shares</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/admin/applications'}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <FileText className="text-primary-600 mr-2" size={20} />
            <span className="font-medium text-gray-900">Review Applications</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/admin/shares'}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Activity className="text-primary-600 mr-2" size={20} />
            <span className="font-medium text-gray-900">Share Audit</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/admin/policy'}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <BarChart3 className="text-primary-600 mr-2" size={20} />
            <span className="font-medium text-gray-900">Policy Management</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard