import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoanHistory from '../components/LoanHistory'
import { 
  CreditCard, 
  History, 
  Plus,
  TrendingUp
} from 'lucide-react'

const Loans = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('history')

  const tabs = [
    { id: 'history', label: 'Loan History', icon: History },
    { id: 'apply', label: 'Apply for Loan', icon: Plus },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Loans</h1>
          </div>
          <p className="text-gray-600">
            Manage your loans, track repayments, and apply for new credit
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'history' && <LoanHistory />}
          
          {activeTab === 'apply' && (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loan Application</h3>
              <p className="text-gray-600 mb-6">
                Loan application functionality will be available soon.
              </p>
              <p className="text-sm text-gray-500">
                For now, you can get a starter loan from the dashboard if you're a new user.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Loans