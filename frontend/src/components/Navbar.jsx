import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Home, 
  CreditCard, 
  FileText, 
  Share2, 
  Settings, 
  LogOut,
  Users,
  BarChart3,
  Wallet,
  DollarSign,
  User
} from 'lucide-react'

const Navbar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const borrowerNavItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/loans', icon: DollarSign, label: 'Loans' },
    { path: '/digital-id', icon: User, label: 'Digital ID' },
    { path: '/apply', icon: FileText, label: 'Apply' },
    { path: '/shares', icon: Share2, label: 'Shares' },
  ]

  const adminNavItems = [
    { path: '/admin', icon: BarChart3, label: 'Dashboard' },
    { path: '/admin/applications', icon: FileText, label: 'Applications' },
    // { path: '/admin#demographics', icon: Users, label: 'Users' },

    // { path: '/admin/shares', icon: Share2, label: 'Shares' },
    // { path: '/admin/policy', icon: Settings, label: 'Policy' },
  ]

  const navItems = user?.role === 'admin' ? adminNavItems : borrowerNavItems

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-8 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <span className="text-white font-bold text-lg">LW</span>
              </div>
              <span className="font-bold text-xl gradient-text">LiwaywAI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                onClick={(e) => {
                  if (path.includes('#demographics') && location.pathname === '/admin') {
                    e.preventDefault();
                    window.history.replaceState(null, '', '/admin#demographics');
                    setTimeout(() => {
                      const el = document.getElementById('demographics');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  ((location.pathname + location.hash) === path) || (location.pathname === path)
                    ? 'text-primary-600 bg-primary-50 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-md'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
            
            <button
              onClick={logout}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={logout}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 bg-white">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              onClick={(e) => {
                if (path.includes('#demographics') && location.pathname === '/admin') {
                  e.preventDefault();
                  window.history.replaceState(null, '', '/admin#demographics');
                  setTimeout(() => {
                    const el = document.getElementById('demographics');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                ((location.pathname + location.hash) === path) || (location.pathname === path)
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navbar