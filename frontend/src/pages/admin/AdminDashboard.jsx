import { useState, useEffect } from 'react'
import { adminAPI } from '../../utils/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Clock,
  BarChart3,
  Activity
} from 'lucide-react'

const initialFromEmail = (email = '') => (email?.[0] || '?').toUpperCase();
const DeltaPill = ({ value }) => {
  if (value === null || value === undefined || isNaN(Number(value))) return null;
  const num = Number(value);
  const positive = num >= 0;
  return (
    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${
      positive ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'
    }`}>
      {positive ? '▲' : '▼'} {positive ? '+' : ''}{num}%
    </span>
  )
}


const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
)

// Bar gradients for ranked lists
const BAR_GRADIENTS = [
  'from-red-600 to-red-400',
  'from-amber-600 to-amber-400',
  'from-emerald-600 to-emerald-400',
  'from-sky-600 to-sky-400',
  'from-indigo-600 to-indigo-400',
  'from-fuchsia-600 to-fuchsia-400',
  'from-rose-600 to-rose-400',
  'from-teal-600 to-teal-400',
]

// --- Lightweight charts ---
const GenderDonut = ({ female = 0, male = 0, other = 0, size = 120, stroke = 14 }) => {
  const total = Math.max(female + male + other, 0);
  const segments = [
    { label: 'Female', value: female, color: '#E11D48' }, 
    { label: 'Male', value: male, color: '#0369A1' },     
    { label: 'Other', value: other, color: '#D97706' },  
  ].filter(s => s.value > 0);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${size/2} ${size/2})`}>
          {/* Background ring */}
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
          {segments.map((s) => {
            const frac = total > 0 ? s.value / total : 0;
            const len = frac * circumference;
            const el = (
              <circle
                key={s.label}
                cx={size/2}
                cy={size/2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </g>
      </svg>
      <div className="text-sm">
        {['Female','Male','Other'].map(lbl => {
          const color = lbl === 'Female' ? 'bg-rose-600' : lbl === 'Male' ? 'bg-sky-700' : 'bg-amber-600';
          const val = lbl === 'Female' ? female : lbl === 'Male' ? male : other;
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          return (
            <div key={lbl} className="flex items-center gap-2 mb-1">
              <span className={`inline-block w-2.5 h-2.5 rounded ${color}`} />
              <span className="text-gray-700">{lbl}</span>
              <span className="ml-auto font-medium text-gray-900">
                {val.toLocaleString()} <span className="text-gray-500 font-normal">({pct}%)</span>
              </span>
            </div>
          );
        })}
        {total === 0 && <p className="text-xs text-gray-500">No gender data yet.</p>}
      </div>
    </div>
  );
};

const AgeBarChart = ({ bands = [], height = 140 }) => {
  const max = Math.max(0, ...bands.map(b => b.count || 0));
  return (
    <div className="w-full">
      <div className="flex items-end gap-3 h-[140px]">
        {bands.map(b => {
          const h = max > 0 ? (b.count / max) * height : 0;
          return (
            <div key={b.label} className="flex flex-col items-center gap-1 flex-1 min-w-[28px]">
              <div
                className="w-6 sm:w-7 bg-amber-500/90 hover:bg-amber-600 rounded-md transition"
                style={{ height: `${h}px` }}
                title={`${b.label} • ${b.count?.toLocaleString?.() || 0}`}
              />
              <div className="text-[10px] text-gray-600">{b.label}</div>
            </div>
          );
        })}
      </div>
      {max === 0 && <p className="text-xs text-gray-500 mt-2">No age data yet.</p>}
    </div>
  );
};

const RegionsBarList = ({ items = [], total = 0, maxItems = 7, showOthers = true }) => {
  // Normalize and sort
  const norm = (Array.isArray(items) ? items : [])
    .filter(i => i && typeof i.label === 'string')
    .map(i => ({ label: i.label, count: Number(i.count) || 0 }))
    .sort((a, b) => (b.count || 0) - (a.count || 0));

  // Slice top N and optionally bucket the rest
  const top = norm.slice(0, Math.max(0, maxItems));
  const restTotal = norm.slice(maxItems).reduce((a, i) => a + (i.count || 0), 0);
  const data = showOthers && restTotal > 0
    ? [...top, { label: 'Others', count: restTotal, _others: true }]
    : top;

  const max = Math.max(0, ...data.map(i => i.count || 0));

  if (data.length === 0) {
    return <p className="text-xs text-gray-500">No data yet.</p>;
  }

  return (
    <div>
      {data.map((row, idx) => {
        const pctOfTotal = total > 0 ? Math.round(((row.count || 0) / total) * 100) : 0;
        const w = max > 0 ? Math.round(((row.count || 0) / max) * 100) : 0;
        const title = `${row.label} • ${row.count.toLocaleString()}${total > 0 ? ` (${pctOfTotal}%)` : ''}`;
        const gradient = row._others ? 'from-gray-400 to-gray-300' : BAR_GRADIENTS[idx % BAR_GRADIENTS.length];
        return (
          <div key={`${row.label}-${idx}`} className="mb-3" title={title}>
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  {idx + 1}
                </span>
                <span className={`truncate ${row._others ? 'text-gray-700 italic' : 'text-gray-700'}`}>{row.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 font-semibold whitespace-nowrap">
                  {row.count.toLocaleString()}
                </span>
                {total > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-700 ring-1 ring-gray-200">
                    {pctOfTotal}%
                  </span>
                )}
              </div>
            </div>
            <div className="relative w-full h-2.5 rounded bg-gray-100/70 ring-1 ring-gray-200 overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradient} transition-all duration-500`}
                style={{ width: `${w}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const levelColors = [
  'bg-red-100', 
  'bg-red-200', 
  'bg-red-300',  
  'bg-red-400',  
  'bg-red-500',  
  'bg-red-600',  
  'bg-red-700', 
  'bg-red-800',  
  'bg-yellow-500', 
  'bg-yellow-600',
  'bg-gray-700'   
]

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard()
      setDashboard(response.data)
    } catch (error) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header skeleton */}
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Metrics skeleton */}
        <div className="grid md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-6">
              <Skeleton className="h-4 w-28 mb-4" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>

        {/* Level Distribution skeleton */}
        <div className="card p-6">
          <Skeleton className="h-5 w-56 mb-4" />
          <div className="grid grid-cols-11 gap-2">
            {Array.from({ length: 11 }).map((_, i) => (
              <Skeleton key={i} className="w-8 h-24" />
            ))}
          </div>
        </div>

        {/* Recent Loans skeleton */}
        <div className="grid md:grid-cols-1 gap-6">
          <div className="card p-6">
            <Skeleton className="h-5 w-60 mb-3" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">Unable to load dashboard data.</p>
        </div>
      </div>
    )
  }

  const { metrics, recentActivity, levelDistribution } = dashboard

  // Demographics safe read and totals
  const demographics = dashboard?.demographics || {
    gender: { female: 0, male: 0, other: 0 },
    ageBands: [
      { label: '18–24', count: 0 },
      { label: '25–34', count: 0 },
      { label: '35–44', count: 0 },
      { label: '45–54', count: 0 },
      { label: '55+', count: 0 },
    ],
    locations: [],
    occupations: [],
  }
  const totalDemBorrowers = (demographics?.total ?? null) 
    ?? (metrics?.totalBorrowers ?? (Array.isArray(levelDistribution) ? levelDistribution.reduce((a, d) => a + (d?.count || 0), 0) : 0));
  const genderTotal = Object.values(demographics.gender || {}).reduce((a, n) => a + (n || 0), 0) || totalDemBorrowers || 0;
  const topLocations = demographics.locations || [];

  const totalBorrowers = metrics?.totalBorrowers ?? levelDistribution.reduce((acc, d) => acc + (d?.count || 0), 0)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-red-600 font-semibold">LiwaywAI · Admin</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of borrowers, loans, and activity</p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-xs text-gray-500">Last updated</p>
          <p className="text-sm font-semibold text-gray-700">{new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="card p-6 border border-gray-100 border-t-2 border-red-600 hover:shadow-md hover:ring-1 hover:ring-gray-200 transition">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Borrowers</h3>
            </div>
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border border-gray-200">
              <Users className="text-gray-600" size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalBorrowers}</p>
          <DeltaPill value={dashboard?.deltas?.totalBorrowers} />
        </div>

        <div className="card p-6 border border-gray-100 border-t-2 border-red-600 hover:shadow-md hover:ring-1 hover:ring-gray-200 transition">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Loans</h3>
            </div>
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border border-gray-200">
              <FileText className="text-gray-600" size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalLoans}</p>
          <DeltaPill value={dashboard?.deltas?.totalLoans} />
        </div>

        <div className="card p-6 border border-gray-100 border-t-2 border-red-600 hover:shadow-md hover:ring-1 hover:ring-gray-200 transition">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Active Loans</h3>
            </div>
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border border-gray-200">
              <TrendingUp className="text-gray-600" size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.activeLoans}</p>
          <DeltaPill value={dashboard?.deltas?.activeLoans} />
        </div>

        <div className="card p-6 border border-gray-100 border-t-2 border-red-600 hover:shadow-md hover:ring-1 hover:ring-gray-200 transition">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Pending Applications</h3>
            </div>
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border border-gray-200">
              <Clock className="text-gray-600" size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.pendingApplications}</p>
          <DeltaPill value={dashboard?.deltas?.pendingApplications} />
        </div>
      </div>

      {/* Level Distribution */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BarChart3 className="text-red-600 mr-2" size={20} />
            <h2 className="text-xl font-semibold text-gray-900">Borrower Level Distribution</h2>
          </div>
          <span className="text-xs text-gray-500">L0–L10</span>
        </div>
        <div className="h-px bg-gray-100 mb-4" />
        
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-11 gap-3">
          {Array.from({ length: 11 }, (_, i) => {
            const levelData = levelDistribution.find(d => d._id === i) || { count: 0 }
            const maxCount = Math.max(...levelDistribution.map(d => d.count))
            const height = maxCount > 0 ? (levelData.count / maxCount) * 100 : 0
            
            return (
              <div key={i} className="text-center">
                {/* percentage label */}
                <div className="text-[10px] text-gray-500 h-4 mb-1">
                  {totalBorrowers > 0 ? `${((levelData.count / totalBorrowers) * 100).toFixed(1)}%` : ''}
                </div>
                <div className="h-32 flex items-end justify-center mb-2">
                  <div
                    title={`L${i} • ${levelData.count} borrower${levelData.count === 1 ? '' : 's'}${totalBorrowers > 0 ? ` (${((levelData.count / totalBorrowers) * 100).toFixed(1)}%)` : ''}`}
                    className={`w-6 md:w-7 ${levelColors[i]} hover:opacity-90 rounded-md level-${i} transition`}
                    style={{ height: `${height}%`, minHeight: levelData.count > 0 ? '8px' : '0' }}
                  />
                </div>
                <div className="text-xs text-gray-600">L{i}</div>
                <div className="text-sm font-medium text-gray-900">{levelData.count}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Demographics */}
      <div id="demographics" className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BarChart3 className="text-red-600 mr-2" size={20} />
            <h2 className="text-xl font-semibold text-gray-900">Borrower Demographics</h2>
          </div>
          {totalDemBorrowers ? (
            <span className="text-xs text-gray-500">{totalDemBorrowers.toLocaleString()} total</span>
          ) : null}
        </div>
        <div className="h-px bg-gray-100 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gender donut */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Gender</h3>
            <GenderDonut
              female={demographics.gender?.female || 0}
              male={demographics.gender?.male || 0}
              other={demographics.gender?.other || 0}
            />
          </div>
          {/* Occupation list */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Occupation</h3>
            <RegionsBarList items={demographics.occupations || []} total={totalDemBorrowers} maxItems={7} showOthers />
          </div>
          {/* Top regions horizontal list */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Top Regions / Provinces</h3>
            <RegionsBarList items={topLocations} total={totalDemBorrowers} maxItems={7} showOthers />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-1 gap-6">
        {/* Recent Loans */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Activity className="text-success-600 mr-2" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Recent Loan Applications</h3>
          </div>
          <div className="h-px bg-gray-100 mb-3" />
          <div className="space-y-3">
            {recentActivity.loans.length > 0 ? (
              recentActivity.loans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-sm font-semibold text-red-700">
                      {initialFromEmail(loan.borrowerEmail)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 leading-none">{loan.borrowerEmail}</p>
                      <p className="text-sm text-gray-600">₱{loan.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      loan.status === 'approved' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' :
                      loan.status === 'declined' ? 'bg-red-50 text-red-700 ring-1 ring-red-200' :
                      'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                    }`}>
                      {loan.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(loan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent loan applications</p>
            )}
          </div>
        </div>

        {/* Recent Shares */}
        {/*
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Activity className="text-primary-600 mr-2" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Recent Digital ID Shares</h3>
          </div>
          
          <div className="space-y-3">
            {recentActivity.shares.length > 0 ? (
              recentActivity.shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{share.borrowerEmail}</p>
                    <p className="text-sm text-gray-600">{share.rpLabel}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-wrap gap-1 justify-end mb-1">
                      {share.scopes.slice(0, 2).map((scope) => (
                        <span key={scope} className="badge badge-primary text-xs">
                          {scope.replace('_', ' ')}
                        </span>
                      ))}
                      {share.scopes.length > 2 && (
                        <span className="text-xs text-gray-500">+{share.scopes.length - 2}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(share.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent shares</p>
            )}
          </div>
        </div>
        */}
      </div>

      {/* Quick Actions */}
      {/*
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/admin/applications'}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <FileText className="text-primary-600 mr-2" size={20} />
            <span className="font-medium text-gray-900">Review Applications</span>
          </button>
          
          {/*
          <button
            onClick={() => window.location.href = '/admin/shares'}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Activity className="text-primary-600 mr-2" size={20} />
            <span className="font-medium text-gray-900">Share Audit</span>
          </button>
          */}
{/*           
          <button
            onClick={() => window.location.href = '/admin/policy'}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <BarChart3 className="text-primary-600 mr-2" size={20} />
            <span className="font-medium text-gray-900">Policy Management</span>
          </button>
        </div>
      </div>
      */}
    </div>
  )
}

export default AdminDashboard