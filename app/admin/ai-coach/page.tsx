'use client'

import { useEffect, useState, useCallback } from 'react'
import type {
  OverviewAlert,
  Team,
  Child,
  AthleteAnalysis,
  AthleteRecommendation,
  TeamSuggestion,
} from './_types'
import { AlertsTab } from './_components/AlertsTab'
import { TeamTab } from './_components/TeamTab'
import { AthleteTab } from './_components/AthleteTab'

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
            <AlertsTab
              loadingAlerts={loadingAlerts}
              alerts={alerts}
              onAnalyze={handleAlertAthleteClick}
            />
          )}

          {/* ── Team Analysis Tab ── */}
          {activeTab === 'team' && (
            <TeamTab
              teams={teams}
              selectedTeamId={selectedTeamId}
              loadTeamAnalysis={loadTeamAnalysis}
              loadingTeam={loadingTeam}
              teamData={teamData}
              onAthleteClick={handleAlertAthleteClick}
            />
          )}

          {/* ── Athlete Analysis Tab ── */}
          {activeTab === 'athlete' && (
            <AthleteTab
              athleteSearch={athleteSearch}
              setAthleteSearch={setAthleteSearch}
              filteredChildren={filteredChildren}
              loadAthleteAnalysis={loadAthleteAnalysis}
              selectedChildId={selectedChildId}
              loadingAthlete={loadingAthlete}
              athleteData={athleteData}
            />
          )}
        </div>
      </div>
    </div>
  )
}
