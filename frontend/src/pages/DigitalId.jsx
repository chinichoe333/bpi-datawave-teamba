import { useState, useEffect } from 'react'
import { borrowerAPI } from '../utils/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  Share2, 
  QrCode, 
  Clock, 
  Shield, 
  Award,
  TrendingUp,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react'

const DigitalId = () => {
  const [digitalId, setDigitalId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareData, setShareData] = useState(null)
  const [selectedScopes, setSelectedScopes] = useState([])

  useEffect(() => {
    fetchDigitalId()
  }, [])

  const fetchDigitalId = async () => {
    try {
      const response = await borrowerAPI.getDigitalId()
      setDigitalId(response.data)
    } catch (error) {
      toast.error('Failed to load digital ID')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (selectedScopes.length === 0) {
      toast.error('Please select at least one scope to share')
      return
    }

    try {
      const response = await borrowerAPI.shareDigitalId({
        scopes: selectedScopes,
        rpLabel: 'Demo Relying Party',
        ttlMinutes: 10
      })
      setShareData(response.data)
      toast.success('Share link created successfully!')
    } catch (error) {
      toast.error('Failed to create share link')
    }
  }

  const scopeOptions = [
    {
      key: 'basic_profile',
      label: 'Basic Profile',
      description: 'LiwaywAI ID, KYC level, join date',
      icon: Shield
    },
    {
      key: 'reliability',
      label: 'Reliability Metrics',
      description: 'Level, caps, streak, payment history',
      icon: Award
    },
    {
      key: 'risk_snapshot',
      label: 'Risk Assessment',
      description: 'Latest PD band, assessment factors',
      icon: TrendingUp
    },
    {
      key: 'credit_pathway',
      label: 'Credit Pathway',
      description: 'Next level requirements, improvement actions',
      icon: Calendar
    }
  ]

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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Digital ID</h1>
          <p className="text-gray-600">Unable to load your digital ID. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Digital ID Card</h1>
        <button
          onClick={() => setShowShareModal(true)}
          className="btn-primary"
        >
          <Share2 size={16} className="mr-2" />
          Share ID
        </button>
      </div>

      {/* Digital ID Card */}
      <div className="card p-8 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">{digitalId.name}</h2>
            <p className="text-primary-100">LiwaywAI ID: {digitalId.liwaywaiId}</p>
          </div>
          <div className={`level-badge level-${digitalId.level.current} border-2 border-white`}>
            {digitalId.level.current}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-primary-200 text-sm mb-1">KYC Level</p>
            <p className="font-semibold capitalize">{digitalId.kycLevel}</p>
          </div>
          <div>
            <p className="text-primary-200 text-sm mb-1">Member Since</p>
            <p className="font-semibold">
              {new Date(digitalId.joinDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-primary-200 text-sm mb-1">Current Limit</p>
            <p className="font-semibold">₱{digitalId.level.unlockedCap.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Level Progress</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Level {digitalId.level.current} → Level {Math.min(digitalId.level.current + 1, 10)}
              </span>
              <span className="text-sm text-gray-500">{digitalId.progress.percentage}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${digitalId.progress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {digitalId.progress.completed} of {digitalId.progress.required} payments completed
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Next Level Unlocks</p>
            <p className="text-2xl font-bold text-primary-600">
              ₱{digitalId.level.nextCap.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              +₱{(digitalId.level.nextCap - digitalId.level.unlockedCap).toLocaleString()} increase
            </p>
          </div>
        </div>
      </div>

      {/* Reliability Metrics */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Reliability Metrics</h3>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600 mb-1">
              {digitalId.reliability.onTimeRate}
            </div>
            <p className="text-sm text-gray-600">On-time Rate</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {digitalId.reliability.streak}
            </div>
            <p className="text-sm text-gray-600">Current Streak</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {digitalId.reliability.totalLoans}
            </div>
            <p className="text-sm text-gray-600">Total Loans</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600 mb-1">
              {digitalId.reliability.onTimePaid}
            </div>
            <p className="text-sm text-gray-600">On-time Paid</p>
          </div>
        </div>
      </div>

      {/* Last Assessment */}
      {digitalId.lastDecision && (
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Latest Risk Assessment</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Risk Band</p>
              <span className={`badge text-lg px-4 py-2 ${
                digitalId.lastDecision.pdBand === 'Very Low' || digitalId.lastDecision.pdBand === 'Low' 
                  ? 'badge-success' 
                  : digitalId.lastDecision.pdBand === 'Medium' 
                  ? 'badge-warning' 
                  : 'badge-danger'
              }`}>
                {digitalId.lastDecision.pdBand}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Assessment Date</p>
              <p className="font-medium">
                {new Date(digitalId.lastDecision.decidedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Key Factors</p>
            <ul className="space-y-1">
              {digitalId.lastDecision.reasons.map((reason, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Actions to Level Up */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h3>
        <div className="space-y-3">
          {digitalId.actionsToLevelUp.map((action, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-primary-50 rounded-lg">
              <Clock className="text-primary-600 mt-0.5 flex-shrink-0" size={16} />
              <span className="text-sm text-primary-800">{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Share Digital ID</h3>
                <button
                  onClick={() => {
                    setShowShareModal(false)
                    setShareData(null)
                    setSelectedScopes([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {!shareData ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Select what information to share. Links expire in 10 minutes and can be revoked anytime.
                  </p>

                  <div className="space-y-3 mb-6">
                    {scopeOptions.map((scope) => {
                      const Icon = scope.icon
                      return (
                        <label
                          key={scope.key}
                          className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedScopes.includes(scope.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedScopes([...selectedScopes, scope.key])
                              } else {
                                setSelectedScopes(selectedScopes.filter(s => s !== scope.key))
                              }
                            }}
                            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <Icon className="text-primary-600 mt-0.5 flex-shrink-0" size={16} />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{scope.label}</p>
                            <p className="text-xs text-gray-500">{scope.description}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowShareModal(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleShare}
                      disabled={selectedScopes.length === 0}
                      className="btn-primary flex-1"
                    >
                      Create Share Link
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <QrCode className="mx-auto text-primary-600 mb-4" size={48} />
                    <h4 className="font-semibold text-gray-900 mb-2">Share Link Created</h4>
                    <p className="text-sm text-gray-600">
                      Expires: {new Date(shareData.expiresAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        QR Code
                      </label>
                      <div 
                        className="border rounded-lg p-4 text-center bg-white"
                        dangerouslySetInnerHTML={{ __html: shareData.qrSvg }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Share URL
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          value={shareData.shareUrl}
                          readOnly
                          className="input flex-1 text-xs"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(shareData.shareUrl)
                            toast.success('Link copied!')
                          }}
                          className="ml-2 btn-secondary"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="bg-warning-50 border border-warning-200 rounded p-3">
                      <p className="text-xs text-warning-800">
                        <strong>Privacy Notice:</strong> This link provides access to selected information only. 
                        It expires automatically and can be revoked from your Share History.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowShareModal(false)
                      setShareData(null)
                      setSelectedScopes([])
                    }}
                    className="btn-primary w-full mt-6"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DigitalId