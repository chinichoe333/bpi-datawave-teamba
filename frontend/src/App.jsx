import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import PrototypeBanner from './components/PrototypeBanner'
import Navbar from './components/Navbar'
import LoadingSpinner from './components/LoadingSpinner'

// Pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import DigitalId from './pages/DigitalId'
import LoanApplication from './pages/LoanApplication'
import LoanDetails from './pages/LoanDetails'
import ShareHistory from './pages/ShareHistory'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminApplications from './pages/admin/AdminApplications'
import AdminBorrowers from './pages/admin/AdminBorrowers'
import AdminShares from './pages/admin/AdminShares'
import ClaimsViewer from './pages/ClaimsViewer'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PrototypeBanner />
      
      {user && <Navbar />}
      
      <main className="pb-16">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
          <Route path="/rp/claims/:token" element={<ClaimsViewer />} />
          
          {/* Protected routes */}
          {user ? (
            <>
              {/* Borrower routes */}
              {user.role === 'borrower' && (
                <>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/digital-id" element={<DigitalId />} />
                  <Route path="/apply" element={<LoanApplication />} />
                  <Route path="/loans/:id" element={<LoanDetails />} />
                  <Route path="/shares" element={<ShareHistory />} />
                </>
              )}
              
              {/* Admin routes */}
              {user.role === 'admin' && (
                <>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/applications" element={<AdminApplications />} />
                  <Route path="/admin/borrowers/:id" element={<AdminBorrowers />} />
                  <Route path="/admin/shares" element={<AdminShares />} />
                </>
              )}
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>
      </main>
    </div>
  )
}

export default App