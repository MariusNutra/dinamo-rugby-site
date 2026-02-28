'use client'

import { useState, useEffect, useCallback } from 'react'
import { csrfHeaders } from '@/lib/csrf-client'

// --- Types ---

interface Badge {
  id: string
  name: string
  icon: string
  description: string | null
  criteria: string
  category: string
  active: boolean
  createdAt: string
  _count?: { athletes: number }
}

interface LeaderboardEntry {
  childId: string
  name: string
  teamName: string | null
  totalPoints: number
  badgeCount: number
}

interface Team {
  id: number
  grupa: string
}

interface ChildOption {
  id: string
  name: string
  teamName: string | null
}

interface PointRecord {
  id: string
  amount: number
  reason: string
  createdAt: string
}

// Emoji picker options
const EMOJI_OPTIONS = ['🏅', '🥇', '🥈', '🥉', '⭐', '🏆', '🎯', '💪', '🔥', '👑', '🦁', '🏉']

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'attendance', label: 'Prezenta' },
  { value: 'performance', label: 'Performanta' },
  { value: 'special', label: 'Special' },
]

const CRITERIA_TYPES = [
  { value: 'manual', label: 'Manual (admin acorda)' },
  { value: 'attendance_streak', label: 'Serie prezente consecutive' },
  { value: 'attendance_total', label: 'Total prezente' },
  { value: 'evaluation_score', label: 'Scor evaluare minim' },
  { value: 'evaluation_improvement', label: 'Imbunatatire evaluare (%)' },
]

const SKILL_OPTIONS = [
  { value: 'physical', label: 'Fizic' },
  { value: 'technical', label: 'Tehnic' },
  { value: 'tactical', label: 'Tactic' },
  { value: 'mental', label: 'Mental' },
  { value: 'social', label: 'Social' },
]

const TABS = ['Badges', 'Leaderboard', 'Puncte'] as const

export default function GamificationPage() {
  const [tab, setTab] = useState<number>(0)

  // Badges state
  const [badges, setBadges] = useState<Badge[]>([])
  const [badgesLoading, setBadgesLoading] = useState(true)
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null)

  // Badge form
  const [badgeName, setBadgeName] = useState('')
  const [badgeIcon, setBadgeIcon] = useState('🏅')
  const [badgeDescription, setBadgeDescription] = useState('')
  const [badgeCategory, setBadgeCategory] = useState('general')
  const [badgeActive, setBadgeActive] = useState(true)
  const [criteriaType, setCriteriaType] = useState('manual')
  const [criteriaDays, setCriteriaDays] = useState(10)
  const [criteriaCount, setCriteriaCount] = useState(50)
  const [criteriaSkill, setCriteriaSkill] = useState('physical')
  const [criteriaMin, setCriteriaMin] = useState(8)
  const [criteriaPercent, setCriteriaPercent] = useState(20)

  // Award badge state
  const [showAwardModal, setShowAwardModal] = useState(false)
  const [awardBadgeId, setAwardBadgeId] = useState('')
  const [awardChildId, setAwardChildId] = useState('')

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [leaderboardTeam, setLeaderboardTeam] = useState<string>('')

  // Points state
  const [pointsChildSearch, setPointsChildSearch] = useState('')
  const [pointsChildId, setPointsChildId] = useState('')
  const [pointsChildName, setPointsChildName] = useState('')
  const [pointsTotal, setPointsTotal] = useState(0)
  const [pointsHistory, setPointsHistory] = useState<PointRecord[]>([])
  const [pointsLoading, setPointsLoading] = useState(false)
  const [awardAmount, setAwardAmount] = useState('')
  const [awardReason, setAwardReason] = useState('')

  // Shared state
  const [teams, setTeams] = useState<Team[]>([])
  const [allChildren, setAllChildren] = useState<ChildOption[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [bulkChecking, setBulkChecking] = useState(false)

  // Fetch teams and children on mount
  useEffect(() => {
    fetch('/api/teams').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setTeams(data.filter((t: Team & { active?: boolean }) => t.active !== false))
    }).catch(() => {})

    fetch('/api/admin/parinti').then(r => r.json()).then(data => {
      if (!Array.isArray(data)) return
      const kids: ChildOption[] = []
      data.forEach((p: { children?: { id: string; name: string; team?: { grupa: string } | null }[] }) => {
        p.children?.forEach(c => {
          kids.push({ id: c.id, name: c.name, teamName: c.team?.grupa ?? null })
        })
      })
      kids.sort((a, b) => a.name.localeCompare(b.name))
      setAllChildren(kids)
    }).catch(() => {})
  }, [])

  // Fetch badges
  const fetchBadges = useCallback(() => {
    setBadgesLoading(true)
    fetch('/api/gamification/badges')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setBadges(data)
        setBadgesLoading(false)
      })
      .catch(() => setBadgesLoading(false))
  }, [])

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(() => {
    setLeaderboardLoading(true)
    const params = new URLSearchParams({ limit: '50' })
    if (leaderboardTeam) params.set('teamId', leaderboardTeam)
    fetch(`/api/gamification/leaderboard?${params}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setLeaderboard(data)
        setLeaderboardLoading(false)
      })
      .catch(() => setLeaderboardLoading(false))
  }, [leaderboardTeam])

  useEffect(() => {
    if (tab === 0) fetchBadges()
    if (tab === 1) fetchLeaderboard()
  }, [tab, fetchBadges, fetchLeaderboard])

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 4000)
      return () => clearTimeout(t)
    }
  }, [message])

  // --- Badge modal helpers ---

  function openNewBadgeModal() {
    setEditingBadge(null)
    setBadgeName('')
    setBadgeIcon('🏅')
    setBadgeDescription('')
    setBadgeCategory('general')
    setBadgeActive(true)
    setCriteriaType('manual')
    setCriteriaDays(10)
    setCriteriaCount(50)
    setCriteriaSkill('physical')
    setCriteriaMin(8)
    setCriteriaPercent(20)
    setShowBadgeModal(true)
  }

  function openEditBadgeModal(badge: Badge) {
    setEditingBadge(badge)
    setBadgeName(badge.name)
    setBadgeIcon(badge.icon)
    setBadgeDescription(badge.description || '')
    setBadgeCategory(badge.category)
    setBadgeActive(badge.active)

    // Parse criteria
    try {
      const c = JSON.parse(badge.criteria)
      setCriteriaType(c.type || 'manual')
      if (c.type === 'attendance_streak') setCriteriaDays(c.days || 10)
      if (c.type === 'attendance_total') setCriteriaCount(c.count || 50)
      if (c.type === 'evaluation_score') {
        setCriteriaSkill(c.skill || 'physical')
        setCriteriaMin(c.min || 8)
      }
      if (c.type === 'evaluation_improvement') {
        setCriteriaSkill(c.skill || 'physical')
        setCriteriaPercent(c.percent || 20)
      }
    } catch {
      setCriteriaType('manual')
    }

    setShowBadgeModal(true)
  }

  function buildCriteria(): object {
    switch (criteriaType) {
      case 'attendance_streak':
        return { type: 'attendance_streak', days: criteriaDays }
      case 'attendance_total':
        return { type: 'attendance_total', count: criteriaCount }
      case 'evaluation_score':
        return { type: 'evaluation_score', skill: criteriaSkill, min: criteriaMin }
      case 'evaluation_improvement':
        return { type: 'evaluation_improvement', skill: criteriaSkill, percent: criteriaPercent }
      default:
        return { type: 'manual' }
    }
  }

  async function saveBadge() {
    const payload = {
      name: badgeName,
      icon: badgeIcon,
      description: badgeDescription || null,
      category: badgeCategory,
      active: badgeActive,
      criteria: buildCriteria(),
    }

    const url = editingBadge
      ? `/api/gamification/badges/${editingBadge.id}`
      : '/api/gamification/badges'
    const method = editingBadge ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setShowBadgeModal(false)
      setMessage({ type: 'success', text: editingBadge ? 'Badge actualizat!' : 'Badge creat!' })
      fetchBadges()
    } else {
      const data = await res.json().catch(() => ({}))
      setMessage({ type: 'error', text: data.error || 'Eroare la salvare' })
    }
  }

  async function deleteBadge(id: string) {
    if (!confirm('Esti sigur ca vrei sa stergi acest badge?')) return
    const res = await fetch(`/api/gamification/badges/${id}`, {
      method: 'DELETE',
      headers: { ...csrfHeaders() },
    })
    if (res.ok) {
      setMessage({ type: 'success', text: 'Badge sters!' })
      fetchBadges()
    }
  }

  async function toggleBadgeActive(badge: Badge) {
    const res = await fetch(`/api/gamification/badges/${badge.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
      body: JSON.stringify({ active: !badge.active }),
    })
    if (res.ok) fetchBadges()
  }

  // --- Award badge ---

  async function awardBadge() {
    if (!awardBadgeId || !awardChildId) return
    const res = await fetch('/api/gamification/badges/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
      body: JSON.stringify({ badgeId: awardBadgeId, childId: awardChildId }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setShowAwardModal(false)
      setAwardBadgeId('')
      setAwardChildId('')
      setMessage({ type: 'success', text: `Badge acordat: ${data.athleteBadge?.badgeName}` })
      fetchBadges()
    } else {
      setMessage({ type: 'error', text: data.error || 'Eroare' })
    }
  }

  // --- Points ---

  async function fetchChildPoints(childId: string) {
    setPointsLoading(true)
    setPointsChildId(childId)
    const child = allChildren.find(c => c.id === childId)
    setPointsChildName(child?.name || '')

    const res = await fetch(`/api/gamification/points?childId=${childId}`)
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setPointsTotal(data.total || 0)
      setPointsHistory(data.history || [])
    }
    setPointsLoading(false)
  }

  async function handleAwardPoints() {
    if (!pointsChildId || !awardAmount || !awardReason) return
    const res = await fetch('/api/gamification/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
      body: JSON.stringify({
        childId: pointsChildId,
        amount: parseInt(awardAmount, 10),
        reason: awardReason,
      }),
    })
    if (res.ok) {
      setAwardAmount('')
      setAwardReason('')
      setMessage({ type: 'success', text: 'Puncte acordate!' })
      fetchChildPoints(pointsChildId)
    } else {
      const data = await res.json().catch(() => ({}))
      setMessage({ type: 'error', text: data.error || 'Eroare' })
    }
  }

  // --- Bulk badge check ---

  async function runBulkBadgeCheck() {
    setBulkChecking(true)
    const res = await fetch('/api/gamification/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
      body: JSON.stringify({ childId: 'all' }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setMessage({
        type: 'success',
        text: `Verificare completa: ${data.checked} sportivi verificati, ${data.awarded} badge-uri noi acordate.`,
      })
      if (tab === 0) fetchBadges()
      if (tab === 1) fetchLeaderboard()
    } else {
      setMessage({ type: 'error', text: data.error || 'Eroare la verificare' })
    }
    setBulkChecking(false)
  }

  // Filtered children for search
  const filteredChildren = pointsChildSearch.length >= 2
    ? allChildren.filter(c => c.name.toLowerCase().includes(pointsChildSearch.toLowerCase()))
    : []

  function getCriteriaLabel(criteria: string): string {
    try {
      const c = JSON.parse(criteria)
      switch (c.type) {
        case 'manual': return 'Manual'
        case 'attendance_streak': return `${c.days} prezente consecutive`
        case 'attendance_total': return `${c.count} prezente total`
        case 'evaluation_score': {
          const skill = SKILL_OPTIONS.find(s => s.value === c.skill)?.label || c.skill
          return `${skill} >= ${c.min}`
        }
        case 'evaluation_improvement': {
          const skill = SKILL_OPTIONS.find(s => s.value === c.skill)?.label || c.skill
          return `${skill} +${c.percent}%`
        }
        default: return '-'
      }
    } catch {
      return '-'
    }
  }

  function getCategoryLabel(category: string): string {
    return CATEGORY_OPTIONS.find(c => c.value === category)?.label || category
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Gamification & Recompense</h1>
        <button
          onClick={runBulkBadgeCheck}
          disabled={bulkChecking}
          className="px-4 py-2 bg-dinamo-blue text-white rounded-lg text-sm font-medium hover:bg-dinamo-blue/90 transition-colors disabled:opacity-50"
        >
          {bulkChecking ? 'Se verifica...' : 'Verifica Badge-uri (toti)'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm mb-4 text-center font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-0">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === i
                  ? 'border-dinamo-red text-dinamo-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Tab */}
      {tab === 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{badges.length} badge-uri</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAwardModal(true); setAwardBadgeId(''); setAwardChildId('') }}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                Acorda Badge
              </button>
              <button
                onClick={openNewBadgeModal}
                className="px-4 py-2 bg-dinamo-red text-white rounded-lg text-sm font-medium hover:bg-dinamo-dark transition-colors"
              >
                + Adauga Badge
              </button>
            </div>
          </div>

          {badgesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
            </div>
          ) : badges.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">🏅</p>
              <p>Nu exista badge-uri. Creeaza primul!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map(badge => (
                <div key={badge.id} className={`bg-white rounded-xl shadow-md p-6 relative transition-opacity ${!badge.active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{badge.icon}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleBadgeActive(badge)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${badge.active ? 'bg-green-500' : 'bg-gray-300'}`}
                        title={badge.active ? 'Dezactiveaza' : 'Activeaza'}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${badge.active ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-1">{badge.name}</h3>
                  {badge.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{badge.description}</p>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      badge.category === 'attendance' ? 'bg-blue-100 text-blue-700' :
                      badge.category === 'performance' ? 'bg-purple-100 text-purple-700' :
                      badge.category === 'special' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getCategoryLabel(badge.category)}
                    </span>
                    <span className="text-xs text-gray-400">{getCriteriaLabel(badge.criteria)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{badge._count?.athletes || 0} sportivi</span>
                    <div className="flex gap-2">
                      <button onClick={() => openEditBadgeModal(badge)} className="text-dinamo-blue hover:underline">
                        Editeaza
                      </button>
                      <button onClick={() => deleteBadge(badge.id)} className="text-red-500 hover:underline">
                        Sterge
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {tab === 1 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-medium text-gray-700">Filtreaza echipa:</label>
            <select
              value={leaderboardTeam}
              onChange={e => setLeaderboardTeam(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Toate echipele</option>
              {teams.map(t => (
                <option key={t.id} value={String(t.id)}>{t.grupa}</option>
              ))}
            </select>
          </div>

          {leaderboardLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">🏆</p>
              <p>Niciun sportiv in clasament. Acorda puncte sau badge-uri!</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium w-12">#</th>
                    <th className="text-left p-3 font-medium">Sportiv</th>
                    <th className="text-left p-3 font-medium hidden sm:table-cell">Echipa</th>
                    <th className="text-center p-3 font-medium">Puncte</th>
                    <th className="text-center p-3 font-medium">Badge-uri</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr key={entry.childId} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (
                          <span className="text-gray-400 font-medium">{idx + 1}</span>
                        )}
                      </td>
                      <td className="p-3 font-medium">{entry.name}</td>
                      <td className="p-3 text-gray-600 hidden sm:table-cell">
                        {entry.teamName && (
                          <span className="text-xs bg-dinamo-blue/10 text-dinamo-blue px-2 py-0.5 rounded-full">
                            {entry.teamName}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-dinamo-red">{entry.totalPoints}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-medium">{entry.badgeCount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Points Tab */}
      {tab === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search and select athlete */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-heading font-bold text-lg mb-4">Cauta sportiv</h3>
            <input
              type="text"
              placeholder="Cauta dupa nume..."
              value={pointsChildSearch}
              onChange={e => setPointsChildSearch(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
            />
            {filteredChildren.length > 0 && (
              <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                {filteredChildren.map(child => (
                  <button
                    key={child.id}
                    onClick={() => {
                      fetchChildPoints(child.id)
                      setPointsChildSearch('')
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      pointsChildId === child.id ? 'bg-dinamo-light' : ''
                    }`}
                  >
                    <span className="font-medium">{child.name}</span>
                    {child.teamName && (
                      <span className="ml-2 text-xs text-gray-400">{child.teamName}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {pointsChildId && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{pointsChildName}</h4>
                  <span className="text-2xl font-bold text-dinamo-red">{pointsTotal} pts</span>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3">Acorda puncte</h4>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Numar puncte"
                      value={awardAmount}
                      onChange={e => setAwardAmount(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Motiv (ex: Comportament exemplar)"
                      value={awardReason}
                      onChange={e => setAwardReason(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleAwardPoints}
                      disabled={!awardAmount || !awardReason}
                      className="w-full px-4 py-2 bg-dinamo-red text-white rounded-lg text-sm font-medium hover:bg-dinamo-dark transition-colors disabled:opacity-50"
                    >
                      Acorda puncte
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Point history */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-heading font-bold text-lg mb-4">Istoric puncte</h3>
            {!pointsChildId ? (
              <p className="text-gray-400 text-sm text-center py-8">Selecteaza un sportiv pentru a vedea istoricul.</p>
            ) : pointsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-3 border-dinamo-red border-t-transparent rounded-full"></div>
              </div>
            ) : pointsHistory.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Niciun punct acordat.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pointsHistory.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{p.reason}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(p.createdAt).toLocaleDateString('ro-RO', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className={`font-bold text-sm ${p.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {p.amount >= 0 ? '+' : ''}{p.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Badge Create/Edit Modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBadgeModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="font-heading font-bold text-xl mb-4">
              {editingBadge ? 'Editeaza Badge' : 'Badge Nou'}
            </h2>

            <div className="space-y-4">
              {/* Icon picker */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Pictograma</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setBadgeIcon(emoji)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        badgeIcon === emoji
                          ? 'bg-dinamo-red/10 ring-2 ring-dinamo-red scale-110'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nume</label>
                <input
                  type="text"
                  value={badgeName}
                  onChange={e => setBadgeName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="ex: Campionul Prezentei"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Descriere</label>
                <textarea
                  value={badgeDescription}
                  onChange={e => setBadgeDescription(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Descrierea badge-ului..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Categorie</label>
                <select
                  value={badgeCategory}
                  onChange={e => setBadgeCategory(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Criteria */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Criteriu</label>
                <select
                  value={criteriaType}
                  onChange={e => setCriteriaType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                >
                  {CRITERIA_TYPES.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {criteriaType === 'attendance_streak' && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Zile consecutive:</label>
                    <input
                      type="number"
                      min={1}
                      value={criteriaDays}
                      onChange={e => setCriteriaDays(parseInt(e.target.value) || 1)}
                      className="w-20 border rounded-lg px-2 py-1 text-sm"
                    />
                  </div>
                )}

                {criteriaType === 'attendance_total' && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Numar prezente:</label>
                    <input
                      type="number"
                      min={1}
                      value={criteriaCount}
                      onChange={e => setCriteriaCount(parseInt(e.target.value) || 1)}
                      className="w-20 border rounded-lg px-2 py-1 text-sm"
                    />
                  </div>
                )}

                {criteriaType === 'evaluation_score' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-sm text-gray-600">Skill:</label>
                    <select
                      value={criteriaSkill}
                      onChange={e => setCriteriaSkill(e.target.value)}
                      className="border rounded-lg px-2 py-1 text-sm"
                    >
                      {SKILL_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <label className="text-sm text-gray-600">Min:</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={criteriaMin}
                      onChange={e => setCriteriaMin(parseInt(e.target.value) || 1)}
                      className="w-16 border rounded-lg px-2 py-1 text-sm"
                    />
                  </div>
                )}

                {criteriaType === 'evaluation_improvement' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-sm text-gray-600">Skill:</label>
                    <select
                      value={criteriaSkill}
                      onChange={e => setCriteriaSkill(e.target.value)}
                      className="border rounded-lg px-2 py-1 text-sm"
                    >
                      {SKILL_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <label className="text-sm text-gray-600">Imbunatatire %:</label>
                    <input
                      type="number"
                      min={1}
                      value={criteriaPercent}
                      onChange={e => setCriteriaPercent(parseInt(e.target.value) || 1)}
                      className="w-16 border rounded-lg px-2 py-1 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Activ</label>
                <button
                  onClick={() => setBadgeActive(!badgeActive)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${badgeActive ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${badgeActive ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBadgeModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anuleaza
              </button>
              <button
                onClick={saveBadge}
                disabled={!badgeName}
                className="flex-1 px-4 py-2 bg-dinamo-red text-white rounded-lg text-sm font-medium hover:bg-dinamo-dark transition-colors disabled:opacity-50"
              >
                {editingBadge ? 'Salveaza' : 'Creeaza'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Award Badge Modal */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAwardModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="font-heading font-bold text-xl mb-4">Acorda Badge Manual</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Badge</label>
                <select
                  value={awardBadgeId}
                  onChange={e => setAwardBadgeId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Selecteaza badge...</option>
                  {badges.filter(b => b.active).map(b => (
                    <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Sportiv</label>
                <select
                  value={awardChildId}
                  onChange={e => setAwardChildId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Selecteaza sportiv...</option>
                  {allChildren.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.teamName ? `(${c.teamName})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAwardModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anuleaza
              </button>
              <button
                onClick={awardBadge}
                disabled={!awardBadgeId || !awardChildId}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                Acorda Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
