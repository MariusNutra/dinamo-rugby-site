'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// --- Types ---

interface AccessRequest {
  id: string
  parentName: string
  email: string
  phone: string | null
  childName: string
  childBirthYear: number
  teamName: string | null
  message: string | null
  createdAt: string
}

interface KPI {
  totalChildren: number
  childrenTrend: number
  revenueThisMonth: number
  revenueTrend: number
  attendanceRate: number
  attendanceTrend: number
  activeSubscriptions: number
  retentionRate: number
}

interface AttendancePoint {
  month: string
  total: number
  uniqueChildren: number
}

interface RevenuePoint {
  month: string
  amount: number
}

interface TeamRow {
  teamName: string
  childCount: number
  attendanceRate: number
  avgEvaluation: number
}

interface ActivityItem {
  type: 'registration' | 'payment' | 'attendance'
  description: string
  timestamp: string
}

interface DashboardStats {
  kpi: KPI
  attendanceTrend: AttendancePoint[]
  revenueTrend: RevenuePoint[]
  registrationsTrend: { month: string; count: number }[]
  teamComparison: TeamRow[]
  recentActivity: ActivityItem[]
}

// --- Helpers ---

function TrendBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value === 0) {
    return <span className="text-xs text-gray-400 font-medium">-{suffix}</span>
  }
  const isPositive = value > 0
  return (
    <span className={`inline-flex items-center text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
      {isPositive ? (
        <svg className="w-3.5 h-3.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      )}
      {isPositive ? '+' : ''}{value}{suffix}
    </span>
  )
}

function relativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'acum'
  if (diffMin < 60) return `acum ${diffMin} min`
  if (diffHr < 24) return `acum ${diffHr} ore`
  if (diffDays < 7) return `acum ${diffDays} zile`
  return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
}

function activityIcon(type: string) {
  switch (type) {
    case 'registration':
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
      )
    case 'payment':
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    case 'attendance':
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
  }
}

// --- Main Component ---

export default function AdminDashboard() {
  const [dashData, setDashData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Legacy state for existing features
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchPending = () => {
    fetch('/api/admin/cereri-acces?status=pending')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.requests) setPendingRequests(data.requests)
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetch('/api/admin/dashboard/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setDashData(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    fetchPending()
  }, [])

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    const res = await fetch(`/api/admin/cereri-acces/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
    if (res.ok) fetchPending()
    setProcessingId(null)
  }

  const handleReject = async (id: string) => {
    if (!confirm('Respinge aceasta cerere?')) return
    setProcessingId(id)
    const res = await fetch(`/api/admin/cereri-acces/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    })
    if (res.ok) fetchPending()
    setProcessingId(null)
  }

  const kpi = dashData?.kpi

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Dashboard</h1>

      {/* ========== KPI Cards ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Sportivi Activi */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <TrendBadge value={loading ? 0 : (kpi?.childrenTrend ?? 0)} />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '-' : kpi?.totalChildren ?? 0}
          </div>
          <div className="text-sm text-gray-500">Sportivi activi</div>
        </div>

        {/* Venit Lunar */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <TrendBadge value={loading ? 0 : (kpi?.revenueTrend ?? 0)} />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '-' : `${(kpi?.revenueThisMonth ?? 0).toLocaleString('ro-RO')} RON`}
          </div>
          <div className="text-sm text-gray-500">Venit lunar</div>
        </div>

        {/* Rata Prezenta */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <TrendBadge value={loading ? 0 : (kpi?.attendanceTrend ?? 0)} suffix="pp" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '-' : `${kpi?.attendanceRate ?? 0}%`}
          </div>
          <div className="text-sm text-gray-500">Rata prezenta</div>
        </div>

        {/* Abonamente Active */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              Retentie: {loading ? '-' : `${kpi?.retentionRate ?? 0}%`}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '-' : kpi?.activeSubscriptions ?? 0}
          </div>
          <div className="text-sm text-gray-500">Abonamente active</div>
        </div>
      </div>

      {/* ========== Charts Row ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Attendance Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-heading font-bold text-lg mb-4">Prezenta - Ultimele 12 luni</h2>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">Se incarca...</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashData?.attendanceTrend ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value, name) => {
                    const label = name === 'total' ? 'Total prezente' : 'Sportivi unici'
                    return [value, label]
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#dc2626' }}
                  activeDot={{ r: 5 }}
                  name="total"
                />
                <Line
                  type="monotone"
                  dataKey="uniqueChildren"
                  stroke="#1e3a5f"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#1e3a5f' }}
                  name="uniqueChildren"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-[#dc2626] inline-block rounded"></span> Total prezente
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-[#1e3a5f] inline-block rounded border-dashed"></span> Sportivi unici
            </span>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-heading font-bold text-lg mb-4">Venituri lunare</h2>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">Se incarca...</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashData?.revenueTrend ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v} RON`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value) => [`${Number(value).toLocaleString('ro-RO')} RON`, 'Venit']}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} name="amount" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ========== Third Row: Team Comparison + Activity Feed ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Team Comparison Table */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-heading font-bold text-lg mb-4">Comparatie echipe</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-gray-400">Se incarca...</div>
          ) : (dashData?.teamComparison?.length ?? 0) === 0 ? (
            <div className="text-gray-400 text-sm text-center py-8">Nicio echipa activa</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-semibold text-gray-600">Echipa</th>
                    <th className="text-center py-2 px-2 font-semibold text-gray-600">Sportivi</th>
                    <th className="text-center py-2 px-2 font-semibold text-gray-600">Prezenta %</th>
                    <th className="text-center py-2 pl-2 font-semibold text-gray-600">Evaluare</th>
                  </tr>
                </thead>
                <tbody>
                  {dashData?.teamComparison.map((team) => (
                    <tr key={team.teamName} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-gray-900">{team.teamName}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-semibold rounded-full w-8 h-8 text-xs">
                          {team.childCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(team.attendanceRate, 100)}%`,
                                backgroundColor: team.attendanceRate >= 75 ? '#10b981' : team.attendanceRate >= 50 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{team.attendanceRate}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 pl-2 text-center">
                        <span className={`font-semibold ${team.avgEvaluation >= 4 ? 'text-emerald-600' : team.avgEvaluation >= 3 ? 'text-amber-600' : 'text-gray-500'}`}>
                          {team.avgEvaluation > 0 ? team.avgEvaluation.toFixed(1) : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-heading font-bold text-lg mb-4">Activitate recenta</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-gray-400">Se incarca...</div>
          ) : (dashData?.recentActivity?.length ?? 0) === 0 ? (
            <div className="text-gray-400 text-sm text-center py-8">Nicio activitate recenta</div>
          ) : (
            <div className="space-y-3">
              {dashData?.recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {activityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{relativeTime(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========== Pending Access Requests (preserved) ========== */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">
              Cereri acces in asteptare
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
            </h2>
            <Link href="/admin/cereri-acces" className="text-sm text-dinamo-blue hover:underline">
              Vezi toate &rarr;
            </Link>
          </div>
          <div className="space-y-3">
            {pendingRequests.slice(0, 5).map(req => (
              <div key={req.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{req.parentName}</div>
                  <div className="text-xs text-gray-500">
                    {req.email} &mdash; copil: {req.childName} ({req.childBirthYear})
                    {req.teamName && ` — ${req.teamName}`}
                  </div>
                  {req.message && <div className="text-xs text-gray-400 mt-0.5 truncate">&bdquo;{req.message}&rdquo;</div>}
                </div>
                <div className="flex gap-2 ml-3">
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={processingId === req.id}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {processingId === req.id ? '...' : 'Aproba'}
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={processingId === req.id}
                    className="text-xs text-red-500 px-3 py-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Respinge
                  </button>
                </div>
              </div>
            ))}
            {pendingRequests.length > 5 && (
              <Link href="/admin/cereri-acces" className="block text-center text-sm text-gray-500 hover:text-dinamo-blue py-2">
                + inca {pendingRequests.length - 5} cereri
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ========== Quick Actions (preserved) ========== */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="font-heading font-bold text-lg mb-4">Actiuni rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/admin/povesti" className="bg-blue-50 text-blue-700 p-4 rounded-lg hover:bg-blue-100 transition-colors text-center font-medium">
            + Adauga poveste noua
          </Link>
          <Link href="/admin/galerie" className="bg-green-50 text-green-700 p-4 rounded-lg hover:bg-green-100 transition-colors text-center font-medium">
            + Incarca poze
          </Link>
          <Link href="/admin/meciuri" className="bg-red-50 text-red-700 p-4 rounded-lg hover:bg-red-100 transition-colors text-center font-medium">
            + Adauga meci
          </Link>
        </div>
      </div>
    </div>
  )
}
