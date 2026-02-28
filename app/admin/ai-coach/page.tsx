'use client'

import { useEffect, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────

interface OverviewAlert {
  type: string
  severity: 'high' | 'medium' | 'low' | 'info'
  title: string
  message: string
  childId?: string
  childName?: string
  teamId?: number
  teamName?: string
}

interface Team {
  id: number
  grupa: string
}

interface Child {
  id: string
  name: string
  teamId: number | null
  team?: { grupa: string } | null
}

interface SkillTrend {
  skill: string
  label: string
  previous: number | null
  current: number | null
  change: number | null
  trend: 'improving' | 'declining' | 'stable' | 'unknown'
}

interface AthleteAnalysis {
  childId: string
  childName: string
  teamId: number | null
  teamName: string | null
  attendanceRate: number | null
  attendanceRateLast3Months: number | null
  attendanceTrend: string
  skillTrends: SkillTrend[]
  strengths: string[]
  weaknesses: string[]
  risks: { type: string; severity: string; message: string }[]
  recommendations: string[]
  latestEvaluation: {
    physical: number
    technical: number
    tactical: number
    mental: number
    social: number
    date: string
    period: string
  } | null
  previousEvaluation: {
    physical: number
    technical: number
    tactical: number
    mental: number
    social: number
    date: string
    period: string
  } | null
  physicalGrowth: {
    latestHeight: number | null
    latestWeight: number | null
    previousHeight: number | null
    previousWeight: number | null
    heightChange: number | null
    weightChange: number | null
    position: string | null
  } | null
  monthlyAttendance: { month: string; rate: number; total: number; present: number }[]
}

interface AthleteRecommendation {
  childId: string
  childName: string
  analysis: AthleteAnalysis
  textRecommendations: string[]
  riskAlerts: string[]
  positiveNotes: string[]
}

interface TeamSuggestion {
  teamId: number
  teamName: string
  totalAthletes: number
  averageAttendanceRate: number
  topPerformers: { childId: string; name: string; averageScore: number }[]
  decliningAthletes: { childId: string; name: string; decliningSkills: string[] }[]
  atRiskAthletes: { childId: string; name: string; reason: string; attendanceRate: number | null }[]
  focusAreas: { skill: string; label: string; averageScore: number; recommendation: string }[]
  recommendations: string[]
}

// ── SVG Radar Chart Component ───────────────────────────────────────────

function RadarChartSVG({ scores }: { scores: { physical: number; technical: number; tactical: number; mental: number; social: number } }) {
  const cx = 150
  const cy = 150
  const R = 120
  const skills = [
    { key: 'physical', label: 'Fizic' },
    { key: 'technical', label: 'Tehnic' },
    { key: 'tactical', label: 'Tactic' },
    { key: 'mental', label: 'Mental' },
    { key: 'social', label: 'Social' },
  ]

  // Calculate vertex positions for a regular pentagon
  // Start from the top (-90 degrees)
  const getPoint = (index: number, radius: number) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  }

  // Background grid pentagons at 2, 4, 6, 8, 10
  const gridLevels = [2, 4, 6, 8, 10]

  // Data polygon
  const dataPoints = skills.map((s, i) => {
    const value = scores[s.key as keyof typeof scores] || 0
    const r = (value / 10) * R
    return getPoint(i, r)
  })
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  // Label positions (slightly outside the pentagon)
  const labelPoints = skills.map((_, i) => getPoint(i, R + 20))

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
      {/* Background grid */}
      {gridLevels.map(level => {
        const r = (level / 10) * R
        const points = skills.map((_, i) => getPoint(i, r))
        const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
        return (
          <path
            key={level}
            d={path}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={level === 10 ? 1.5 : 0.8}
          />
        )
      })}

      {/* Axis lines from center to each vertex */}
      {skills.map((_, i) => {
        const p = getPoint(i, R)
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="#e5e7eb"
            strokeWidth={0.8}
          />
        )
      })}

      {/* Data polygon */}
      <path
        d={dataPath}
        fill="rgba(220, 38, 38, 0.25)"
        stroke="#dc2626"
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={`point-${i}`}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="#dc2626"
          stroke="white"
          strokeWidth={1.5}
        />
      ))}

      {/* Labels */}
      {skills.map((s, i) => {
        const p = labelPoints[i]
        return (
          <text
            key={`label-${i}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-medium fill-gray-700"
            fontSize={11}
          >
            {s.label}
          </text>
        )
      })}

      {/* Score values next to data points */}
      {skills.map((s, i) => {
        const value = scores[s.key as keyof typeof scores] || 0
        const r = (value / 10) * R
        const p = getPoint(i, r)
        // Offset the score label slightly
        const labelR = Math.max(r - 15, 10)
        const lp = getPoint(i, labelR)
        return (
          <text
            key={`score-${i}`}
            x={value > 3 ? lp.x : p.x}
            y={value > 3 ? lp.y : p.y - 12}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] font-bold fill-red-700"
            fontSize={10}
          >
            {value}
          </text>
        )
      })}
    </svg>
  )
}

// ── Attendance Progress Bar ─────────────────────────────────────────────

function AttendanceGauge({ rate, label }: { rate: number; label?: string }) {
  const color = rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  const textColor = rate >= 80 ? 'text-green-700' : rate >= 60 ? 'text-yellow-700' : 'text-red-700'

  return (
    <div>
      {label && <p className="text-sm text-gray-600 mb-1">{label}</p>}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </div>
        <span className={`font-bold text-lg min-w-[50px] text-right ${textColor}`}>
          {rate}%
        </span>
      </div>
    </div>
  )
}

// ── Monthly Attendance Bars ─────────────────────────────────────────────

function MonthlyBars({ data }: { data: { month: string; rate: number; total: number; present: number }[] }) {
  const maxHeight = 120

  return (
    <div className="flex items-end justify-between gap-2 h-[160px] px-2">
      {data.map((d, i) => {
        const barHeight = d.total > 0 ? (d.rate / 100) * maxHeight : 0
        const color = d.rate >= 80 ? 'bg-green-500' : d.rate >= 60 ? 'bg-yellow-500' : d.rate > 0 ? 'bg-red-500' : 'bg-gray-200'

        return (
          <div key={i} className="flex flex-col items-center flex-1">
            <span className="text-xs font-semibold text-gray-700 mb-1">
              {d.total > 0 ? `${d.rate}%` : '-'}
            </span>
            <div className="w-full flex items-end justify-center" style={{ height: maxHeight }}>
              <div
                className={`w-full max-w-[36px] rounded-t-md transition-all duration-500 ${color}`}
                style={{ height: Math.max(barHeight, 4) }}
                title={`${d.present}/${d.total} prezente`}
              />
            </div>
            <span className="text-[10px] text-gray-500 mt-1 text-center leading-tight">
              {d.month}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Severity helpers ────────────────────────────────────────────────────

function getSeverityStyles(severity: string) {
  switch (severity) {
    case 'high':
      return {
        border: 'border-l-red-500',
        bg: 'bg-red-50',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ),
      }
    case 'medium':
      return {
        border: 'border-l-yellow-500',
        bg: 'bg-yellow-50',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      }
    case 'low':
      return {
        border: 'border-l-blue-500',
        bg: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      }
    default:
      return {
        border: 'border-l-green-500',
        bg: 'bg-green-50',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      }
  }
}

// ── Main Page ───────────────────────────────────────────────────────────

export default function AICoachPage() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'team' | 'athlete'>('alerts')
  const [alerts, setAlerts] = useState<OverviewAlert[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [allChildren, setAllChildren] = useState<Child[]>([])
  const [loadingAlerts, setLoadingAlerts] = useState(true)
  const [loadingTeam, setLoadingTeam] = useState(false)
  const [loadingAthlete, setLoadingAthlete] = useState(false)

  // Team analysis state
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [teamData, setTeamData] = useState<TeamSuggestion | null>(null)

  // Athlete analysis state
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [athleteSearch, setAthleteSearch] = useState('')
  const [athleteData, setAthleteData] = useState<{
    analysis: AthleteAnalysis
    recommendations: AthleteRecommendation
  } | null>(null)

  // ── Load initial data ──
  useEffect(() => {
    // Load alerts
    fetch('/api/admin/ai/overview')
      .then(r => r.json())
      .then(data => {
        if (data.alerts) setAlerts(data.alerts)
      })
      .catch(() => {})
      .finally(() => setLoadingAlerts(false))

    // Load teams
    fetch('/api/teams?active=1')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setTeams(data)
      })
      .catch(() => {})

    // Load all children via parinti endpoint
    fetch('/api/admin/parinti')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        const kids: Child[] = []
        data.forEach((p: { children?: { id: string; name: string; teamId: number | null; team?: { grupa: string } | null }[] }) => {
          p.children?.forEach(c => {
            kids.push({ id: c.id, name: c.name, teamId: c.teamId, team: c.team })
          })
        })
        kids.sort((a, b) => a.name.localeCompare(b.name))
        setAllChildren(kids)
      })
      .catch(() => {})
  }, [])

  // ── Load team analysis ──
  const loadTeamAnalysis = useCallback((teamId: number) => {
    setSelectedTeamId(teamId)
    setTeamData(null)
    setLoadingTeam(true)

    fetch('/api/admin/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.suggestions) setTeamData(data.suggestions)
      })
      .catch(() => {})
      .finally(() => setLoadingTeam(false))
  }, [])

  // ── Load athlete analysis ──
  const loadAthleteAnalysis = useCallback((childId: string) => {
    setSelectedChildId(childId)
    setAthleteData(null)
    setLoadingAthlete(true)

    fetch('/api/admin/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.analysis && data.recommendations) {
          setAthleteData({
            analysis: data.analysis,
            recommendations: data.recommendations,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAthlete(false))
  }, [])

  // Handle clicking on an athlete in alerts
  const handleAlertAthleteClick = (childId: string) => {
    setActiveTab('athlete')
    loadAthleteAnalysis(childId)
    setAthleteSearch('')
  }

  // Filtered children for search
  const filteredChildren = athleteSearch.length >= 2
    ? allChildren.filter(c => c.name.toLowerCase().includes(athleteSearch.toLowerCase()))
    : []

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Coach Assistant</h1>
          <p className="text-gray-500 text-sm">Analiza automata si recomandari bazate pe date</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === 'alerts'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Alerte
              {alerts.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {alerts.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === 'team'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Analiza Echipa
            </span>
          </button>
          <button
            onClick={() => setActiveTab('athlete')}
            className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === 'athlete'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Analiza Sportiv
            </span>
          </button>
        </div>

        <div className="p-6">
          {/* ── Alerts Tab ── */}
          {activeTab === 'alerts' && (
            <div>
              {loadingAlerts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700">Totul este in regula!</h3>
                  <p className="text-gray-500 mt-1">Nu exista alerte active in acest moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Group by severity */}
                  {['high', 'medium', 'low'].map(severity => {
                    const severityAlerts = alerts.filter(a => a.severity === severity)
                    if (severityAlerts.length === 0) return null
                    const severityLabels: Record<string, string> = {
                      high: 'Alerte Critice',
                      medium: 'Avertizari',
                      low: 'Informatii',
                    }
                    return (
                      <div key={severity}>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          {severityLabels[severity]} ({severityAlerts.length})
                        </h3>
                        <div className="space-y-2 mb-4">
                          {severityAlerts.map((alert, idx) => {
                            const styles = getSeverityStyles(alert.severity)
                            return (
                              <div
                                key={idx}
                                className={`border-l-4 ${styles.border} ${styles.bg} rounded-r-lg p-4 flex items-start gap-3`}
                              >
                                <div className={`w-8 h-8 rounded-full ${styles.iconBg} ${styles.iconColor} flex items-center justify-center flex-shrink-0`}>
                                  {styles.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-800 text-sm">{alert.title}</p>
                                  <p className="text-gray-600 text-sm mt-0.5">{alert.message}</p>
                                </div>
                                {alert.childId && (
                                  <button
                                    onClick={() => handleAlertAthleteClick(alert.childId!)}
                                    className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                                  >
                                    Analizeaza
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Team Analysis Tab ── */}
          {activeTab === 'team' && (
            <div>
              {/* Team selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Selecteaza echipa</label>
                <select
                  value={selectedTeamId || ''}
                  onChange={e => {
                    const val = e.target.value
                    if (val) loadTeamAnalysis(Number(val))
                  }}
                  className="w-full md:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">-- Alege echipa --</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.grupa}</option>
                  ))}
                </select>
              </div>

              {loadingTeam ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
                </div>
              ) : teamData ? (
                <div className="space-y-6">
                  {/* Team header stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-gray-900">{teamData.totalAthletes}</p>
                      <p className="text-sm text-gray-500">Sportivi</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-2 text-center">Prezenta medie (3 luni)</p>
                      <AttendanceGauge rate={teamData.averageAttendanceRate} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-gray-900">{teamData.atRiskAthletes.length}</p>
                      <p className="text-sm text-gray-500">Sportivi la risc</p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {teamData.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Recomandari
                      </h3>
                      <div className="space-y-2">
                        {teamData.recommendations.map((rec, i) => (
                          <div key={i} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                            <p className="text-sm text-gray-700">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Performers */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        Top Performeri
                      </h3>
                      {teamData.topPerformers.length === 0 ? (
                        <p className="text-sm text-gray-500">Nu exista evaluari.</p>
                      ) : (
                        <div className="space-y-2">
                          {teamData.topPerformers.map((p, i) => (
                            <div
                              key={p.childId}
                              onClick={() => handleAlertAthleteClick(p.childId)}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                i === 1 ? 'bg-gray-100 text-gray-600' :
                                i === 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {i + 1}
                              </span>
                              <span className="flex-1 text-sm font-medium text-gray-800">{p.name}</span>
                              <span className="text-sm font-bold text-green-600">{p.averageScore.toFixed(1)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* At-Risk Athletes */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Sportivi la Risc
                      </h3>
                      {teamData.atRiskAthletes.length === 0 ? (
                        <p className="text-sm text-gray-500">Niciun sportiv la risc.</p>
                      ) : (
                        <div className="space-y-2">
                          {teamData.atRiskAthletes.map(a => (
                            <div
                              key={a.childId}
                              onClick={() => handleAlertAthleteClick(a.childId)}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                            >
                              <span className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                                </svg>
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800">{a.name}</p>
                                <p className="text-xs text-red-600">{a.reason}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Declining Athletes */}
                  {teamData.decliningAthletes.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        Performanta in Scadere
                      </h3>
                      <div className="space-y-2">
                        {teamData.decliningAthletes.map(a => (
                          <div
                            key={a.childId}
                            onClick={() => handleAlertAthleteClick(a.childId)}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
                          >
                            <span className="flex-1 text-sm font-medium text-gray-800">{a.name}</span>
                            <div className="flex gap-1 flex-wrap justify-end">
                              {a.decliningSkills.map(s => (
                                <span key={s} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{s}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Focus Areas */}
                  {teamData.focusAreas.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Arii de Focus
                      </h3>
                      <div className="space-y-3">
                        {teamData.focusAreas.map(fa => {
                          const barColor = fa.averageScore >= 7 ? 'bg-green-500' : fa.averageScore >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                          return (
                            <div key={fa.skill}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{fa.label}</span>
                                <span className="text-sm font-bold text-gray-900">{fa.averageScore}/10</span>
                              </div>
                              <div className="bg-gray-200 rounded-full h-2.5 mb-1">
                                <div
                                  className={`h-full rounded-full ${barColor} transition-all duration-500`}
                                  style={{ width: `${(fa.averageScore / 10) * 100}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500">{fa.recommendation}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>Selecteaza o echipa pentru a vedea analiza</p>
                </div>
              )}
            </div>
          )}

          {/* ── Athlete Analysis Tab ── */}
          {activeTab === 'athlete' && (
            <div>
              {/* Athlete search */}
              <div className="mb-6 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cauta sportiv</label>
                <input
                  type="text"
                  placeholder="Scrie numele sportivului..."
                  value={athleteSearch}
                  onChange={e => setAthleteSearch(e.target.value)}
                  className="w-full md:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                {filteredChildren.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full md:w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredChildren.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          loadAthleteAnalysis(c.id)
                          setAthleteSearch('')
                        }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                          selectedChildId === c.id ? 'bg-red-50' : ''
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.team?.grupa || 'Fara echipa'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {loadingAthlete ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
                </div>
              ) : athleteData ? (
                <div className="space-y-6">
                  {/* Athlete header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{athleteData.analysis.childName}</h2>
                        <p className="text-sm text-gray-500">{athleteData.analysis.teamName || 'Fara echipa'}</p>
                      </div>
                      <div className="flex gap-3">
                        {athleteData.analysis.attendanceRate !== null && (
                          <div className="text-center">
                            <p className={`text-2xl font-bold ${
                              athleteData.analysis.attendanceRate >= 80 ? 'text-green-600' :
                              athleteData.analysis.attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {athleteData.analysis.attendanceRate}%
                            </p>
                            <p className="text-xs text-gray-500">Prezenta</p>
                          </div>
                        )}
                        {athleteData.analysis.latestEvaluation && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">
                              {((athleteData.analysis.latestEvaluation.physical +
                                athleteData.analysis.latestEvaluation.technical +
                                athleteData.analysis.latestEvaluation.tactical +
                                athleteData.analysis.latestEvaluation.mental +
                                athleteData.analysis.latestEvaluation.social) / 5).toFixed(1)}
                            </p>
                            <p className="text-xs text-gray-500">Scor mediu</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Risk alerts */}
                  {athleteData.recommendations.riskAlerts.length > 0 && (
                    <div className="space-y-2">
                      {athleteData.recommendations.riskAlerts.map((alert, i) => (
                        <div key={i} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-2">
                          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <p className="text-sm text-red-800">{alert}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Positive notes */}
                  {athleteData.recommendations.positiveNotes.length > 0 && (
                    <div className="space-y-2">
                      {athleteData.recommendations.positiveNotes.map((note, i) => (
                        <div key={i} className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-green-800">{note}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Radar Chart */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 text-center">Profil Competente</h3>
                      {athleteData.analysis.latestEvaluation ? (
                        <RadarChartSVG scores={athleteData.analysis.latestEvaluation} />
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                          Nu exista evaluari
                        </div>
                      )}
                      {athleteData.analysis.latestEvaluation && (
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Evaluare: {athleteData.analysis.latestEvaluation.period}
                          {' '}({new Date(athleteData.analysis.latestEvaluation.date).toLocaleDateString('ro-RO')})
                        </p>
                      )}
                    </div>

                    {/* Attendance trend */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-4 text-center">Tendinta Prezenta (6 luni)</h3>
                      {athleteData.analysis.monthlyAttendance.some(m => m.total > 0) ? (
                        <MonthlyBars data={athleteData.analysis.monthlyAttendance} />
                      ) : (
                        <div className="h-[160px] flex items-center justify-center text-gray-400 text-sm">
                          Nu exista date de prezenta
                        </div>
                      )}
                      {athleteData.analysis.attendanceRateLast3Months !== null && (
                        <div className="mt-4">
                          <AttendanceGauge
                            rate={athleteData.analysis.attendanceRateLast3Months}
                            label="Prezenta ultimele 3 luni"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skill progression */}
                  {athleteData.analysis.latestEvaluation && athleteData.analysis.previousEvaluation && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Progresie Competente
                      </h3>
                      <div className="space-y-3">
                        {athleteData.analysis.skillTrends.map(st => {
                          const changeColor = st.change !== null
                            ? st.change > 0 ? 'text-green-600' : st.change < 0 ? 'text-red-600' : 'text-gray-500'
                            : 'text-gray-400'
                          const changeIcon = st.change !== null
                            ? st.change > 0 ? (
                              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                            ) : st.change < 0 ? (
                              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                              </svg>
                            )
                            : null

                          return (
                            <div key={st.skill} className="flex items-center gap-4">
                              <span className="text-sm font-medium text-gray-700 w-16">{st.label}</span>
                              <div className="flex-1 flex items-center gap-2">
                                <span className="text-sm text-gray-500 w-6 text-right">{st.previous ?? '-'}</span>
                                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                <span className="text-sm font-bold text-gray-900 w-6">{st.current ?? '-'}</span>
                              </div>
                              <span className={`text-sm font-semibold flex items-center gap-1 w-16 justify-end ${changeColor}`}>
                                {changeIcon}
                                {st.change !== null ? (st.change > 0 ? `+${st.change}` : st.change) : '-'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                        <span>Anterior: {athleteData.analysis.previousEvaluation.period}</span>
                        <span>Curent: {athleteData.analysis.latestEvaluation.period}</span>
                      </div>
                    </div>
                  )}

                  {/* Physical growth */}
                  {athleteData.analysis.physicalGrowth && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        Dezvoltare Fizica
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {athleteData.analysis.physicalGrowth.latestHeight && (
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-gray-800">{athleteData.analysis.physicalGrowth.latestHeight}</p>
                            <p className="text-xs text-gray-500">Inaltime (cm)</p>
                            {athleteData.analysis.physicalGrowth.heightChange !== null && (
                              <p className={`text-xs font-semibold mt-1 ${athleteData.analysis.physicalGrowth.heightChange > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                {athleteData.analysis.physicalGrowth.heightChange > 0 ? '+' : ''}{athleteData.analysis.physicalGrowth.heightChange} cm
                              </p>
                            )}
                          </div>
                        )}
                        {athleteData.analysis.physicalGrowth.latestWeight && (
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-gray-800">{athleteData.analysis.physicalGrowth.latestWeight}</p>
                            <p className="text-xs text-gray-500">Greutate (kg)</p>
                            {athleteData.analysis.physicalGrowth.weightChange !== null && (
                              <p className={`text-xs font-semibold mt-1 ${athleteData.analysis.physicalGrowth.weightChange > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                                {athleteData.analysis.physicalGrowth.weightChange > 0 ? '+' : ''}{athleteData.analysis.physicalGrowth.weightChange} kg
                              </p>
                            )}
                          </div>
                        )}
                        {athleteData.analysis.physicalGrowth.position && (
                          <div className="bg-gray-50 rounded-lg p-3 text-center col-span-2">
                            <p className="text-lg font-bold text-gray-800">{athleteData.analysis.physicalGrowth.position}</p>
                            <p className="text-xs text-gray-500">Pozitie</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {athleteData.recommendations.textRecommendations.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Recomandari
                      </h3>
                      <div className="space-y-2">
                        {athleteData.recommendations.textRecommendations.map((rec, i) => (
                          <div key={i} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                            <p className="text-sm text-gray-700">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths & Weaknesses */}
                  {(athleteData.analysis.strengths.length > 0 || athleteData.analysis.weaknesses.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {athleteData.analysis.strengths.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            Puncte Forte
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {athleteData.analysis.strengths.map(s => (
                              <span key={s} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {athleteData.analysis.weaknesses.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                          <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            De Imbunatatit
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {athleteData.analysis.weaknesses.map(w => (
                              <span key={w} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                                {w}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p>Cauta un sportiv pentru a vedea analiza detaliata</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
