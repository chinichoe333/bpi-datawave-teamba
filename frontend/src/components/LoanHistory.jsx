import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { borrowerAPI } from '../utils/api'
import LoadingSpinner from './LoadingSpinner'
import {
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Calendar,
    DollarSign,
    TrendingUp,
    Eye,
    Filter,
    RefreshCw
} from 'lucide-react'

const LoanHistory = () => {
    const [loans, setLoans] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedLoan, setSelectedLoan] = useState(null)
    const [showDetails, setShowDetails] = useState(false)
    const [statusFilter, setStatusFilter] = useState('all')
    const [pagination, setPagination] = useState({ total: 0, hasMore: false })

    useEffect(() => {
        fetchLoanHistory()
    }, [statusFilter])

    const fetchLoanHistory = async () => {
        try {
            setLoading(true)
            const params = { limit: 20, offset: 0 }
            if (statusFilter !== 'all') {
                params.status = statusFilter
            }

            const response = await borrowerAPI.getLoanHistory(params)

            if (response.data.success) {
                setLoans(response.data.data.loans)
                setPagination(response.data.data.pagination)
            } else {
                toast.error('Failed to load loan history')
            }
        } catch (error) {
            console.error('Loan history error:', error)
            toast.error('Failed to load loan history')
        } finally {
            setLoading(false)
        }
    }

    const fetchLoanDetails = async (loanId) => {
        try {
            const response = await borrowerAPI.getLoan(loanId)
            setSelectedLoan(response.data)
            setShowDetails(true)
        } catch (error) {
            console.error('Loan details error:', error)
            toast.error('Failed to load loan details')
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
            case 'approved':
                return <CheckCircle className="w-5 h-5 text-success-500" />
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-success-600" />
            case 'declined':
                return <XCircle className="w-5 h-5 text-error-500" />
            case 'applied':
                return <Clock className="w-5 h-5 text-warning-500" />
            case 'counter_offered':
                return <AlertCircle className="w-5 h-5 text-info-500" />
            default:
                return <Clock className="w-5 h-5 text-gray-400" />
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
            case 'approved':
                return 'bg-success-100 text-success-800 border-success-200'
            case 'completed':
                return 'bg-success-100 text-success-900 border-success-300'
            case 'declined':
                return 'bg-error-100 text-error-800 border-error-200'
            case 'applied':
                return 'bg-warning-100 text-warning-800 border-warning-200'
            case 'counter_offered':
                return 'bg-info-100 text-info-800 border-info-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Loan History</h2>
                    <p className="text-gray-600 mt-1">Track your borrowing journey and repayment progress</p>
                </div>
                <button
                    onClick={fetchLoanHistory}
                    className="btn-secondary flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-select text-sm"
                >
                    <option value="all">All Loans</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="applied">Applied</option>
                    <option value="declined">Declined</option>
                    <option value="counter_offered">Counter Offered</option>
                </select>
            </div>

            {/* Loan List */}
            {loans.length === 0 ? (
                <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
                    <p className="text-gray-600">
                        {statusFilter === 'all'
                            ? "You haven't applied for any loans yet."
                            : `No loans with status "${statusFilter}" found.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {loans.map((loan) => (
                        <div
                            key={loan.id}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        {getStatusIcon(loan.status)}
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(loan.status)}`}>
                                            {loan.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Applied {formatDate(loan.createdAt)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Amount</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {formatCurrency(loan.amount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Term</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {loan.termWeeks} weeks
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Purpose</p>
                                            <p className="text-sm text-gray-900 truncate" title={loan.purpose}>
                                                {loan.purpose}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Repayment Progress */}
                                    {loan.repaymentSummary && loan.repaymentSummary.total > 0 && (
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-600">Repayment Progress</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {loan.repaymentSummary.paid}/{loan.repaymentSummary.total} payments
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-success-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${loan.repaymentSummary.progress}%` }}
                                                />
                                            </div>
                                            {loan.repaymentSummary.overdue > 0 && (
                                                <p className="text-sm text-error-600 mt-1">
                                                    {loan.repaymentSummary.overdue} overdue payment(s)
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Risk Score */}
                                    {loan.riskScore && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <TrendingUp className="w-4 h-4" />
                                            <span>Risk Band: {loan.riskScore.pdBand}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => fetchLoanDetails(loan.id)}
                                    className="btn-secondary flex items-center gap-2 ml-4"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Load More */}
            {pagination.hasMore && (
                <div className="text-center">
                    <button
                        onClick={() => {
                            // Implement load more functionality
                            toast.info('Load more functionality coming soon')
                        }}
                        className="btn-secondary"
                    >
                        Load More Loans
                    </button>
                </div>
            )}

            {/* Loan Details Modal */}
            {showDetails && selectedLoan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Loan Details</h3>
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Loan ID</p>
                                        <p className="font-mono text-sm">{selectedLoan.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedLoan.status)}`}>
                                            {selectedLoan.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Amount</p>
                                        <p className="text-lg font-semibold">{formatCurrency(selectedLoan.amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Term</p>
                                        <p className="text-lg font-semibold">{selectedLoan.termWeeks} weeks</p>
                                    </div>
                                </div>

                                {/* Purpose */}
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Purpose</p>
                                    <p className="text-gray-900">{selectedLoan.purpose}</p>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Applied</p>
                                        <p className="text-gray-900">{formatDate(selectedLoan.createdAt)}</p>
                                    </div>
                                    {selectedLoan.approvedAt && (
                                        <div>
                                            <p className="text-sm text-gray-600">Approved</p>
                                            <p className="text-gray-900">{formatDate(selectedLoan.approvedAt)}</p>
                                        </div>
                                    )}
                                    {selectedLoan.completedAt && (
                                        <div>
                                            <p className="text-sm text-gray-600">Completed</p>
                                            <p className="text-gray-900">{formatDate(selectedLoan.completedAt)}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Decision Info */}
                                {selectedLoan.decision && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">Decision Details</h4>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-sm text-gray-600">Decision</p>
                                                <p className="font-medium">{selectedLoan.decision.decision.toUpperCase()}</p>
                                            </div>
                                            {selectedLoan.decision.reasons && selectedLoan.decision.reasons.length > 0 && (
                                                <div>
                                                    <p className="text-sm text-gray-600">Reasons</p>
                                                    <ul className="list-disc list-inside text-sm text-gray-900">
                                                        {selectedLoan.decision.reasons.map((reason, index) => (
                                                            <li key={index}>{reason}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Risk Score */}
                                {selectedLoan.riskScore && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">Risk Assessment</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600">Risk Band</p>
                                                <p className="font-medium">{selectedLoan.riskScore.pdBand}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">PD Score</p>
                                                <p className="font-mono text-sm">{selectedLoan.riskScore.pd.toFixed(4)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Repayments */}
                                {selectedLoan.repayments && selectedLoan.repayments.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">Repayment Schedule</h4>
                                        <div className="space-y-2">
                                            {selectedLoan.repayments.map((repayment, index) => (
                                                <div
                                                    key={repayment._id}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Week {index + 1}
                                                        </span>
                                                        <span className="text-sm text-gray-900">
                                                            Due: {formatDate(repayment.dueDate)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-medium">
                                                            {formatCurrency(repayment.amount)}
                                                        </span>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${repayment.status === 'paid'
                                                            ? 'bg-success-100 text-success-800'
                                                            : repayment.status === 'pending' && new Date(repayment.dueDate) < new Date()
                                                                ? 'bg-error-100 text-error-800'
                                                                : 'bg-warning-100 text-warning-800'
                                                            }`}>
                                                            {repayment.status === 'paid'
                                                                ? 'PAID'
                                                                : repayment.status === 'pending' && new Date(repayment.dueDate) < new Date()
                                                                    ? 'OVERDUE'
                                                                    : 'PENDING'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LoanHistory