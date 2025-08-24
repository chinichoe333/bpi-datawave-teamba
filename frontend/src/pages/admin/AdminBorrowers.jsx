import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { adminAPI } from '../../utils/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'

const AdminBorrowers = () => {
  const { id } = useParams()
  const [borrower, setBorrower] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchBorrower()
    }
  }, [id])

  const fetchBorrower = async () => {
    try {
      const response = await adminAPI.getBorrower(id)
      setBorrower(response.data)
    } catch (error) {
      toast.error('Failed to load borrower details')
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

  if (!borrower) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Borrower Not Found</h1>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Borrower Details</h1>
      
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">{borrower.borrower.profile?.name}</h2>
        <p className="text-gray-600">{borrower.borrower.email}</p>
        
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Gender:</span>
            <span className="ml-2">{borrower.borrower.profile?.gender || '—'}</span>
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Location:</span>
            <span className="ml-2">{
              [
                borrower.borrower.profile?.city,
                borrower.borrower.profile?.province,
                borrower.borrower.profile?.country
              ].filter(Boolean).join(', ') || '—'
            }</span>
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Occupation:</span>
            <span className="ml-2">{borrower.borrower.profile?.occupation || '—'}</span>
          </p>
        </div>
        
        {borrower.borrower.level && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Level: {borrower.borrower.level.current}</p>
            <p className="text-sm text-gray-600">Cap: ₱{borrower.borrower.level.unlockedCap?.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminBorrowers