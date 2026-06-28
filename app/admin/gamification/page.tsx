'use client'

import { useState, useEffect, useCallback } from 'react'
import { csrfHeaders } from '@/lib/csrf-client'
import type { Badge, LeaderboardEntry, Team, ChildOption, PointRecord } from './_types'
import { TABS } from './_constants'
import BadgesTab from './_components/BadgesTab'
import LeaderboardTab from './_components/LeaderboardTab'
import PointsTab from './_components/PointsTab'
import BadgeFormModal from './_components/BadgeFormModal'
import AwardBadgeModal from './_components/AwardBadgeModal'

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
        <BadgesTab
          badges={badges}
          badgesLoading={badgesLoading}
          onOpenAward={() => { setShowAwardModal(true); setAwardBadgeId(''); setAwardChildId('') }}
          onOpenNewBadge={openNewBadgeModal}
          onEditBadge={openEditBadgeModal}
          onDeleteBadge={deleteBadge}
          onToggleActive={toggleBadgeActive}
        />
      )}

      {/* Leaderboard Tab */}
      {tab === 1 && (
        <LeaderboardTab
          leaderboard={leaderboard}
          leaderboardLoading={leaderboardLoading}
          leaderboardTeam={leaderboardTeam}
          setLeaderboardTeam={setLeaderboardTeam}
          teams={teams}
        />
      )}

      {/* Points Tab */}
      {tab === 2 && (
        <PointsTab
          pointsChildSearch={pointsChildSearch}
          setPointsChildSearch={setPointsChildSearch}
          filteredChildren={filteredChildren}
          onSelectChild={fetchChildPoints}
          pointsChildId={pointsChildId}
          pointsChildName={pointsChildName}
          pointsTotal={pointsTotal}
          pointsHistory={pointsHistory}
          pointsLoading={pointsLoading}
          awardAmount={awardAmount}
          setAwardAmount={setAwardAmount}
          awardReason={awardReason}
          setAwardReason={setAwardReason}
          onAwardPoints={handleAwardPoints}
        />
      )}

      {/* Badge Create/Edit Modal */}
      {showBadgeModal && (
        <BadgeFormModal
          editingBadge={editingBadge}
          onClose={() => setShowBadgeModal(false)}
          onSave={saveBadge}
          badgeName={badgeName}
          setBadgeName={setBadgeName}
          badgeIcon={badgeIcon}
          setBadgeIcon={setBadgeIcon}
          badgeDescription={badgeDescription}
          setBadgeDescription={setBadgeDescription}
          badgeCategory={badgeCategory}
          setBadgeCategory={setBadgeCategory}
          badgeActive={badgeActive}
          setBadgeActive={setBadgeActive}
          criteriaType={criteriaType}
          setCriteriaType={setCriteriaType}
          criteriaDays={criteriaDays}
          setCriteriaDays={setCriteriaDays}
          criteriaCount={criteriaCount}
          setCriteriaCount={setCriteriaCount}
          criteriaSkill={criteriaSkill}
          setCriteriaSkill={setCriteriaSkill}
          criteriaMin={criteriaMin}
          setCriteriaMin={setCriteriaMin}
          criteriaPercent={criteriaPercent}
          setCriteriaPercent={setCriteriaPercent}
        />
      )}

      {/* Award Badge Modal */}
      {showAwardModal && (
        <AwardBadgeModal
          badges={badges}
          allChildren={allChildren}
          awardBadgeId={awardBadgeId}
          setAwardBadgeId={setAwardBadgeId}
          awardChildId={awardChildId}
          setAwardChildId={setAwardChildId}
          onClose={() => setShowAwardModal(false)}
          onAward={awardBadge}
        />
      )}
    </div>
  )
}
