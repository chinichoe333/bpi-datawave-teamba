import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
}

export const borrowerAPI = {
  getDigitalId: () => api.get('/me/digital-id'),
  shareDigitalId: (data) => api.post('/me/digital-id/share', data),
  getShareHistory: () => api.get('/me/digital-id/share/history'),
  revokeShare: (id) => api.post(`/me/digital-id/share/${id}/revoke`),
  applyLoan: (data) => api.post('/loans/apply', data),
  getLoan: (id) => api.get(`/loans/${id}`),
  getLoanHistory: (params) => api.get('/loans', { params }),
  markPaid: (id) => api.post(`/loans/${id}/repayments/mark-paid`),
  getStarterLoan: () => api.post('/loans/starter'),
}

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getApplications: (params) => api.get('/admin/applications', { params }),
  overrideApplication: (id, data) => api.post(`/admin/applications/${id}/override`, data),
  getBorrower: (id) => api.get(`/admin/borrowers/${id}`),
  getShares: (params) => api.get('/admin/shares', { params }),
  updatePolicy: (data) => api.put('/admin/policy', data),
  getPolicy: () => api.get('/admin/policy'),
}

export const walletAPI = {
  getWallet: () => api.get('/wallet'),
  addFunds: (amount, description) => api.post('/wallet/add-funds', { amount, description }),
  withdraw: (amount, description) => api.post('/wallet/withdraw', { amount, description }),
  payLoan: (repaymentId, amount) => api.post('/wallet/pay-loan', { repaymentId, amount }),
  simulateFunds: () => api.post('/wallet/simulate-funds'),
  simulateLevelUp: () => api.post('/wallet/simulate-level-up'),
  getTransactions: (limit, offset) => api.get('/wallet/transactions', { params: { limit, offset } }),
}

export const rpAPI = {
  getClaims: (token) => axios.get(`${API_BASE_URL}/rp/claims/${token}`),
  verifyJWT: (jwt) => axios.get(`${API_BASE_URL}/rp/verify/${jwt}`),
}