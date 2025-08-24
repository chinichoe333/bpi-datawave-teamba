import { useState, useEffect } from 'react'
import { adminAPI } from '../../utils/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'

const AdminShares = () => {
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchShares()
  }, [])

  const fetchShares = async () => {
    try {
      const response = await adminAPI.getShares()
      setShares(response.data.shares)
    } catch (error) {
      toast.error('Failed to load shares')
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Digital ID Shares</h1>
      
      <div className="card p-6">
        <div className="space-y-4">
          {shares.map((share) => (
            <div key={share.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{share.borrowerEmail}</h3>
                  <p className="text-gray-600">{share.rpLabel}</p>
                  <div className="flex gap-2 mt-2">
                    {share.scopes.map((scope) => (
                      <span key={scope} className="badge badge-primary text-xs">
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge ${share.isActive ? 'badge-success' : 'badge-secondary'}`}>
                    {share.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Accessed {share.accessCount} times
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminShares