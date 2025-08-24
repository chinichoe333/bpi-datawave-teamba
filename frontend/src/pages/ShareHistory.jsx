import { useState, useEffect } from 'react'
import { borrowerAPI } from '../utils/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  Share2, 
  Clock, 
  Eye, 
  Shield,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react'

const ShareHistory = () => {
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchShareHistory()
  }, [])

  const fetchShareHistory = async () => {
    try {
      const response = await borrowerAPI.getShareHistory()
      setShares(response.data)
    } catch (error) {
      toast.error('Failed to load share history')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (shareId) => {
    try {
      await borrowerAPI.revokeShare(shareId)
      toast.success('Share revoked successfully')
      fetchShareHistory() // Refresh the list
    } catch (error) {
      toast.error('Failed to revoke share')
    }
  }

  const getStatusIcon = (share) => {
    if (share.revokedAt) return XCircle
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) return Clock
    return CheckCircle
  }

  const getStatusColor = (share) => {
    if (share.revokedAt) return 'text-danger-500'
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) return 'text-warning-500'
    return 'text-success-500'
  }

  const getStatusText = (share) => {
    if (share.revokedAt) return 'Revoked'
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) return 'Expired'
    return 'Active'
  }

  const getScopeIcon = (scope) => {
    switch (scope) {
      case 'basic_profile': return Shield
      case 'reliability': return CheckCircle
      case 'risk_snapshot': return Eye
      case 'credit_pathway': return Calendar
      default: return Share2
    }
  }

  const getScopeLabel = (scope) => {
    switch (scope) {
      case 'basic_profile': return 'Basic Profile'
      case 'reliability': return 'Reliability'
      case 'risk_snapshot': return 'Risk Assessment'
      case 'credit_pathway': return 'Credit Pathway'
      default: return scope
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Share History</h1>
        <div className="text-sm text-gray-500">
          {shares.length} total shares
        </div>
      </div>

      {shares.length === 0 ? (
        <div className="card p-8 text-center">
          <Share2 className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shares Yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't shared your digital ID with anyone yet.
          </p>
          <button
            onClick={() => window.location.href = '/digital-id'}
            className="btn-primary"
          >
            Share Your Digital ID
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {shares.map((share) => {
            const StatusIcon = getStatusIcon(share)
            const isActive = share.isActive
            
            return (
              <div key={share.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{share.rpLabel}</h3>
                      <div className="flex items-center space-x-1">
                        <StatusIcon size={16} className={getStatusColor(share)} />
                        <span className={`text-sm font-medium ${getStatusColor(share)}`}>
                          {getStatusText(share)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {share.scopes.map((scope) => {
                        const Icon = getScopeIcon(scope)
                        return (
                          <span key={scope} className="badge badge-primary flex items-center">
                            <Icon size={12} className="mr-1" />
                            {getScopeLabel(scope)}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  
                  {isActive && (
                    <button
                      onClick={() => handleRevoke(share.id)}
                      className="btn-danger text-sm"
                    >
                      Revoke
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Created</p>
                    <p className="font-medium">
                      {new Date(share.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(share.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600">Expires</p>
                    <p className="font-medium">
                      {new Date(share.expiresAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(share.expiresAt).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {share.revokedAt && (
                    <div>
                      <p className="text-gray-600">Revoked</p>
                      <p className="font-medium text-danger-600">
                        {new Date(share.revokedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-danger-500">
                        {new Date(share.revokedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-gray-600">Access Count</p>
                    <p className="font-medium text-primary-600">
                      {share.accessCount} times
                    </p>
                  </div>
                </div>

                {/* Time remaining for active shares */}
                {isActive && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock size={14} className="text-warning-500" />
                      <span className="text-warning-600">
                        {new Date(share.expiresAt) > new Date() 
                          ? `Expires in ${Math.ceil((new Date(share.expiresAt) - new Date()) / (1000 * 60))} minutes`
                          : 'Expired'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Info Card */}
      <div className="card p-6 mt-6 bg-primary-50 border-primary-200">
        <h3 className="font-semibold text-primary-900 mb-2">About Digital ID Sharing</h3>
        <div className="text-sm text-primary-800 space-y-2">
          <p>• <strong>Time-limited:</strong> All shares expire automatically (default: 10 minutes)</p>
          <p>• <strong>Scoped:</strong> Only requested information is shared</p>
          <p>• <strong>Revocable:</strong> You can revoke access anytime</p>
          <p>• <strong>Auditable:</strong> Complete access history is maintained</p>
          <p>• <strong>Privacy-first:</strong> No PII is shared by default</p>
        </div>
      </div>
    </div>
  )
}

export default ShareHistory