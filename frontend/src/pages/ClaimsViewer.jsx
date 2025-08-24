import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { rpAPI } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  Shield, 
  Award, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye
} from 'lucide-react'

const ClaimsViewer = () => {
  const { token } = useParams()
  const [claims, setClaims] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showJWT, setShowJWT] = useState(false)

  useEffect(() => {
    fetchClaims()
  }, [token])

  const fetchClaims = async () => {
    try {
      const response = await rpAPI.getClaims(token)
      setClaims(response.data)
    } catch (error) {
      setError({
        message: error.response?.data?.error || 'Failed to fetch claims',
        code: error.response?.data?.code || 'UNKNOWN_ERROR',
        status: error.response?.status
      })
    } finally {
      setLoading(false)
    }
  }

  const getScopeIcon = (scope) => {
    switch (scope) {
      case 'basic_profile': return Shield
      case 'reliability': return Award
      case 'risk_snapshot': return TrendingUp
      case 'credit_pathway': return Calendar
      default: return Eye
    }
  }

  const getScopeLabel = (scope) => {
    switch (scope) {
      case 'basic_profile': return 'Basic Profile'
      case 'reliability': return 'Reliability Metrics'
      case 'risk_snapshot': return 'Risk Assessment'
      case 'credit_pathway': return 'Credit Pathway'
      default: return scope
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Verifying access token...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full">
          <div className="card p-8 text-center">
            <AlertCircle className="mx-auto text-danger-500 mb-4" size={64} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">{error.message}</p>
            
            {error.code === 'TOKEN_EXPIRED' && (
              <div className="bg-warning-50 border border-warning-200 rounded p-3 mb-4">
                <p className="text-sm text-warning-800">
                  This share link has expired. Please request a new one from the borrower.
                </p>
              </div>
            )}
            
            {error.code === 'TOKEN_REVOKED' && (
              <div className="bg-danger-50 border border-danger-200 rounded p-3 mb-4">
                <p className="text-sm text-danger-800">
                  This share link has been revoked by the borrower.
                </p>
              </div>
            )}
            
            <p className="text-xs text-gray-500">
              Error Code: {error.code} | Status: {error.status}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">LW</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Identity Claims</h1>
          <p className="text-gray-600">Verified information shared by {claims.claims.sub}</p>
        </div>

        {/* Metadata */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Share Information</h2>
            <CheckCircle className="text-success-500" size={24} />
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Issued By</p>
              <p className="font-medium">{claims.claims.iss}</p>
            </div>
            <div>
              <p className="text-gray-600">Issued To</p>
              <p className="font-medium">{claims.claims.aud}</p>
            </div>
            <div>
              <p className="text-gray-600">Expires At</p>
              <p className="font-medium text-warning-600">
                {new Date(claims.metadata.expires_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 mb-2">Authorized Scopes:</p>
            <div className="flex flex-wrap gap-2">
              {claims.metadata.scopes.map((scope) => {
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
        </div>

        {/* Claims Data */}
        <div className="space-y-6">
          {/* Basic Profile */}
          {claims.claims.basic_profile && (
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <Shield className="text-primary-600 mr-2" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Basic Profile</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">LiwaywAI ID</p>
                  <p className="font-medium">{claims.claims.basic_profile.liwaywai_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">KYC Level</p>
                  <span className={`badge ${
                    claims.claims.basic_profile.kyc_level === 'verified' 
                      ? 'badge-success' 
                      : 'badge-warning'
                  }`}>
                    {claims.claims.basic_profile.kyc_level}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="font-medium">
                    {new Date(claims.claims.basic_profile.join_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reliability */}
          {claims.claims.reliability && (
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <Award className="text-success-600 mr-2" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Reliability Metrics</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Current Level</p>
                  <div className="flex items-center space-x-3">
                    <div className={`level-badge level-${claims.claims.reliability.level}`}>
                      {claims.claims.reliability.level}
                    </div>
                    <div>
                      <p className="font-semibold">{claims.claims.reliability.level_badge}</p>
                      <p className="text-sm text-gray-600">
                        ₱{claims.claims.reliability.unlocked_cap.toLocaleString()} limit
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Progress to Next Level</p>
                  <div className="progress-bar mb-2">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${claims.claims.reliability.progress.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {claims.claims.reliability.progress.completed} of {claims.claims.reliability.progress.required} completed ({claims.claims.reliability.progress.percentage}%)
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">
                    {claims.claims.reliability.reliability_metrics.on_time_rate}
                  </div>
                  <p className="text-xs text-gray-600">On-time Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {claims.claims.reliability.streak}
                  </div>
                  <p className="text-xs text-gray-600">Current Streak</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {claims.claims.reliability.reliability_metrics.total_loans}
                  </div>
                  <p className="text-xs text-gray-600">Total Loans</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">
                    {claims.claims.reliability.reliability_metrics.on_time_paid}
                  </div>
                  <p className="text-xs text-gray-600">On-time Paid</p>
                </div>
              </div>
            </div>
          )}

          {/* Risk Snapshot */}
          {claims.claims.risk_snapshot && (
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="text-warning-600 mr-2" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Risk Band</p>
                  <span className={`badge text-lg px-4 py-2 ${
                    claims.claims.risk_snapshot.pd_band === 'Very Low' || claims.claims.risk_snapshot.pd_band === 'Low' 
                      ? 'badge-success' 
                      : claims.claims.risk_snapshot.pd_band === 'Medium' 
                      ? 'badge-warning' 
                      : 'badge-danger'
                  }`}>
                    {claims.claims.risk_snapshot.pd_band}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Assessment Date</p>
                  <p className="font-medium">
                    {claims.claims.risk_snapshot.assessment_date 
                      ? new Date(claims.claims.risk_snapshot.assessment_date).toLocaleDateString()
                      : 'No recent assessment'
                    }
                  </p>
                </div>
              </div>

              {claims.claims.risk_snapshot.reasons && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Assessment Factors</p>
                  <ul className="space-y-1">
                    {claims.claims.risk_snapshot.reasons.map((reason, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-primary-500 mr-2">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Credit Pathway */}
          {claims.claims.credit_pathway && (
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <Calendar className="text-primary-600 mr-2" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Credit Pathway</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Limit</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₱{claims.claims.credit_pathway.current_cap.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Next Level Unlocks</p>
                  <p className="text-2xl font-bold text-primary-600">
                    ₱{claims.claims.credit_pathway.next_cap.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Actions to Level Up</p>
                <div className="space-y-2">
                  {claims.claims.credit_pathway.actions_to_level_up.map((action, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 bg-primary-50 rounded">
                      <Clock className="text-primary-600 mt-0.5 flex-shrink-0" size={14} />
                      <span className="text-sm text-primary-800">{action}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Estimated timeline: {claims.claims.credit_pathway.estimated_timeline}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* JWT Token */}
        <div className="card p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cryptographic Verification</h3>
            <button
              onClick={() => setShowJWT(!showJWT)}
              className="btn-secondary text-sm"
            >
              {showJWT ? 'Hide' : 'Show'} JWT Token
            </button>
          </div>
          
          {showJWT && (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                JWS-signed token for cryptographic verification:
              </p>
              <textarea
                value={claims.jwt}
                readOnly
                className="w-full h-32 text-xs font-mono bg-gray-50 border rounded p-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                This token can be verified using the public key to ensure data integrity and authenticity.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 p-4 bg-warning-50 border border-warning-200 rounded">
          <p className="text-sm text-warning-800">
            <strong>⚠️ PROTOTYPE NOTICE:</strong> This is a simulation for demonstration purposes only. 
            Not for production use.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ClaimsViewer