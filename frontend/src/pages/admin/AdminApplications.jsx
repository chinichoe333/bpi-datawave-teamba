import { useState, useEffect } from 'react'
import { adminAPI } from '../../utils/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'

const AdminApplications = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await adminAPI.getApplications()
      setApplications(response.data.applications)
    } catch (error) {
      toast.error('Failed to load applications')
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Loan Applications</h1>
      
      <div className="card p-6">
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{app.borrower.name}</h3>
                  <p className="text-gray-600">₱{app.amount.toLocaleString()}</p>
                </div>
                <span className={`badge ${
                  app.status === 'approved' ? 'badge-success' :
                  app.status === 'declined' ? 'badge-danger' :
                  'badge-warning'
                }`}>
                  {app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminApplications