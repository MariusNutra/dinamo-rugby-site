'use client'

import { useEffect, useState, useCallback } from 'react'

interface CompetitionTeam {
  id: string
  competitionId: string
  teamName: string
  points: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
}

interface Match {
  id: string
  category: string
  matchType: string
  round: string | null
  date: string
  location: string | null
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  isDinamo: boolean
  notes: string | null
  competitionId: string | null
}

interface Competition {
  id: string
  name: string
  type: string
  season: string | null
  category: string | null
  startDate: string | null
  endDate: string | null
  description: string | null
  active: boolean
  teams: CompetitionTeam[]
  matches?: Match[]
  teamCount: number
  matchCount: number
}

const TYPE_LABELS: Record<string, string> = {
  liga: 'Liga',
  turneu: 'Turneu',
  cupa: 'Cupa',
}

const TYPE_COLORS: Record<string, string> = {
  liga: 'bg-blue-100 text-blue-800',
  turneu: 'bg-green-100 text-green-800',
  cupa: 'bg-amber-100 text-amber-800',
}

const emptyForm = {
  name: '',
  type: 'turneu',
  season: '',
  category: '',
  startDate: '',
  endDate: '',
  description: '',
  teamsText: '',
}

const emptyMatchForm = {
  category: '',
  matchType: 'turneu',
  round: '',
  date: '',
  location: '',
  homeTeam: '',
  awayTeam: '',
  homeScore: '',
  awayScore: '',
  notes: '',
}

export default function AdminCompetitii() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [showTeamInput, setShowTeamInput] = useState<string | null>(null)
  const [newTeamName, setNewTeamName] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedData, setExpandedData] = useState<Competition | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [editForm, setEditForm] = useState({ ...emptyForm, id: '' })
  const [matchForm, setMatchForm] = useState({ ...emptyMatchForm })
  const [saving, setSaving] = useState(false)
  const [recalculating, setRecalculating] = useState(false)

  const loadCompetitions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/competitions')
      if (res.ok) {
        const data = await res.json()
        setCompetitions(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCompetitions()
  }, [loadCompetitions])

  const loadExpanded = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/competitions/${id}`)
      if (res.ok) {
        const data = await res.json()
        setExpandedData(data)
      }
    } catch {
      // ignore
    }
  }, [])

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedData(null)
    } else {
      setExpandedId(id)
      loadExpanded(id)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const teams = form.teamsText
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(teamName => ({ teamName }))

    try {
      const res = await fetch('/api/admin/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          season: form.season || null,
          category: form.category || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          description: form.description || null,
          teams,
        }),
      })
      if (res.ok) {
        setShowCreateModal(false)
        setForm({ ...emptyForm })
        loadCompetitions()
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/competitions/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          type: editForm.type,
          season: editForm.season || null,
          category: editForm.category || null,
          startDate: editForm.startDate || null,
          endDate: editForm.endDate || null,
          description: editForm.description || null,
        }),
      })
      if (res.ok) {
        setShowEditModal(false)
        loadCompetitions()
        if (expandedId === editForm.id) loadExpanded(editForm.id)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (comp: Competition) => {
    setEditForm({
      id: comp.id,
      name: comp.name,
      type: comp.type,
      season: comp.season || '',
      category: comp.category || '',
      startDate: comp.startDate ? comp.startDate.slice(0, 10) : '',
      endDate: comp.endDate ? comp.endDate.slice(0, 10) : '',
      description: comp.description || '',
      teamsText: '',
    })
    setShowEditModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sigur vrei sa stergi aceasta competitie? Se vor sterge si echipele asociate.')) return
    try {
      await fetch(`/api/admin/competitions/${id}`, { method: 'DELETE' })
      if (expandedId === id) {
        setExpandedId(null)
        setExpandedData(null)
      }
      loadCompetitions()
    } catch {
      // ignore
    }
  }

  const handleRecalculate = async (id: string) => {
    setRecalculating(true)
    try {
      const res = await fetch(`/api/admin/competitions/${id}/standings`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setExpandedData(data)
        loadCompetitions()
      }
    } catch {
      // ignore
    } finally {
      setRecalculating(false)
    }
  }

  const handleAddTeam = async (competitionId: string) => {
    if (!newTeamName.trim()) return
    setSaving(true)
    try {
      // We'll use a direct prisma approach via a simple API - add team by creating via competition update
      // Since we don't have a dedicated team endpoint, we'll create one inline
      const res = await fetch(`/api/admin/competitions/${competitionId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: newTeamName.trim() }),
      })
      if (res.ok) {
        setNewTeamName('')
        setShowTeamInput(null)
        loadExpanded(competitionId)
        loadCompetitions()
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTeam = async (competitionId: string, teamId: string) => {
    if (!confirm('Sigur vrei sa stergi aceasta echipa din competitie?')) return
    try {
      await fetch(`/api/admin/competitions/${competitionId}/teams/${teamId}`, {
        method: 'DELETE',
      })
      loadExpanded(competitionId)
      loadCompetitions()
    } catch {
      // ignore
    }
  }

  const openMatchModal = (comp: Competition) => {
    setMatchForm({
      ...emptyMatchForm,
      category: comp.category || '',
    })
    setShowMatchModal(true)
  }

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expandedId) return
    setSaving(true)
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: matchForm.category || 'General',
          matchType: matchForm.matchType,
          round: matchForm.round || null,
          date: matchForm.date,
          location: matchForm.location || null,
          homeTeam: matchForm.homeTeam,
          awayTeam: matchForm.awayTeam,
          homeScore: matchForm.homeScore !== '' ? parseInt(matchForm.homeScore) : null,
          awayScore: matchForm.awayScore !== '' ? parseInt(matchForm.awayScore) : null,
          isDinamo: false,
          notes: matchForm.notes || null,
          competitionId: expandedId,
        }),
      })
      if (res.ok) {
        setShowMatchModal(false)
        setMatchForm({ ...emptyMatchForm })
        loadExpanded(expandedId)
        loadCompetitions()
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Competitii & Turnee</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-dinamo-red text-white px-5 py-2 rounded-lg font-bold hover:bg-dinamo-dark transition-colors text-sm"
        >
          + Adauga competitie
        </button>
      </div>

      {/* Competition cards */}
      {competitions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-400 text-lg">Nu exista competitii.</p>
          <p className="text-gray-400 text-sm mt-2">Adauga prima competitie folosind butonul de mai sus.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {competitions.map(comp => (
            <div key={comp.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Card header */}
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(comp.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-heading font-bold text-lg">{comp.name}</h3>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[comp.type] || 'bg-gray-100 text-gray-800'}`}>
                        {TYPE_LABELS[comp.type] || comp.type}
                      </span>
                      {!comp.active && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-500">
                          Inactiva
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {comp.season && (
                        <span>Sezon: <strong className="text-gray-700">{comp.season}</strong></span>
                      )}
                      {comp.category && (
                        <span>Categorie: <strong className="text-gray-700">{comp.category}</strong></span>
                      )}
                      <span>
                        {formatDate(comp.startDate)}
                        {comp.endDate && ` — ${formatDate(comp.endDate)}`}
                      </span>
                      <span>{comp.teamCount} echipe</span>
                      <span>{comp.matchCount} meciuri</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(comp) }}
                      className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Editare
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(comp.id) }}
                      className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Sterge
                    </button>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === comp.id ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {expandedId === comp.id && expandedData && (
                <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    <button
                      onClick={() => setShowTeamInput(comp.id)}
                      className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      + Adauga echipa
                    </button>
                    <button
                      onClick={() => openMatchModal(comp)}
                      className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      + Adauga meci
                    </button>
                    <button
                      onClick={() => handleRecalculate(comp.id)}
                      disabled={recalculating}
                      className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
                    >
                      {recalculating ? 'Se recalculeaza...' : 'Recalculeaza clasament'}
                    </button>
                  </div>

                  {/* Add team inline */}
                  {showTeamInput === comp.id && (
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Numele echipei"
                        value={newTeamName}
                        onChange={e => setNewTeamName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddTeam(comp.id)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleAddTeam(comp.id)}
                        disabled={saving}
                        className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
                      >
                        Adauga
                      </button>
                      <button
                        onClick={() => { setShowTeamInput(null); setNewTeamName('') }}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                      >
                        Anuleaza
                      </button>
                    </div>
                  )}

                  {/* Standings table */}
                  {expandedData.teams.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-heading font-bold text-sm uppercase text-gray-500 mb-3">Clasament</h4>
                      <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-dinamo-blue text-white text-xs uppercase">
                                <th className="px-3 py-2.5 text-center w-10">#</th>
                                <th className="px-3 py-2.5 text-left">Echipa</th>
                                <th className="px-3 py-2.5 text-center w-10">MJ</th>
                                <th className="px-3 py-2.5 text-center w-10">V</th>
                                <th className="px-3 py-2.5 text-center w-10">E</th>
                                <th className="px-3 py-2.5 text-center w-10">I</th>
                                <th className="px-3 py-2.5 text-center w-12">GM</th>
                                <th className="px-3 py-2.5 text-center w-12">GP</th>
                                <th className="px-3 py-2.5 text-center w-12">GD</th>
                                <th className="px-3 py-2.5 text-center w-12 font-bold">Pts</th>
                                <th className="px-3 py-2.5 text-center w-10"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {expandedData.teams.map((team, idx) => (
                                <tr
                                  key={team.id}
                                  className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${idx === 0 ? 'font-semibold' : ''}`}
                                >
                                  <td className="px-3 py-2.5 text-center text-gray-500">{idx + 1}</td>
                                  <td className="px-3 py-2.5 font-medium">{team.teamName}</td>
                                  <td className="px-3 py-2.5 text-center">{team.played}</td>
                                  <td className="px-3 py-2.5 text-center text-green-700">{team.won}</td>
                                  <td className="px-3 py-2.5 text-center text-gray-500">{team.drawn}</td>
                                  <td className="px-3 py-2.5 text-center text-red-600">{team.lost}</td>
                                  <td className="px-3 py-2.5 text-center">{team.goalsFor}</td>
                                  <td className="px-3 py-2.5 text-center">{team.goalsAgainst}</td>
                                  <td className="px-3 py-2.5 text-center">
                                    {team.goalsFor - team.goalsAgainst > 0 ? '+' : ''}{team.goalsFor - team.goalsAgainst}
                                  </td>
                                  <td className="px-3 py-2.5 text-center font-bold text-dinamo-red">{team.points}</td>
                                  <td className="px-3 py-2.5 text-center">
                                    <button
                                      onClick={() => handleDeleteTeam(comp.id, team.id)}
                                      className="text-red-400 hover:text-red-600 text-xs"
                                      title="Sterge echipa"
                                    >
                                      &times;
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Matches list */}
                  {expandedData.matches && expandedData.matches.length > 0 && (
                    <div>
                      <h4 className="font-heading font-bold text-sm uppercase text-gray-500 mb-3">Meciuri</h4>
                      <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100 text-xs text-gray-500 uppercase">
                                <th className="px-3 py-2 text-left">Data</th>
                                <th className="px-3 py-2 text-left">Runda</th>
                                <th className="px-3 py-2 text-left">Meci</th>
                                <th className="px-3 py-2 text-center">Scor</th>
                                <th className="px-3 py-2 text-left">Locatie</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expandedData.matches.map(match => (
                                <tr key={match.id} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                                    {new Date(match.date).toLocaleDateString('ro-RO', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                  </td>
                                  <td className="px-3 py-2.5 text-gray-500 text-xs">
                                    {match.round || '—'}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span className="font-medium">{match.homeTeam}</span>
                                    <span className="mx-1.5 text-gray-400">vs</span>
                                    <span className="font-medium">{match.awayTeam}</span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    {match.homeScore !== null ? (
                                      <span className="font-bold">{match.homeScore} - {match.awayScore}</span>
                                    ) : (
                                      <span className="text-gray-400 text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-gray-500 text-xs">
                                    {match.location || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {expandedData.teams.length === 0 && (!expandedData.matches || expandedData.matches.length === 0) && (
                    <p className="text-gray-400 text-sm text-center py-6">
                      Aceasta competitie nu are inca echipe sau meciuri.
                    </p>
                  )}
                </div>
              )}

              {/* Loading state for expanded */}
              {expandedId === comp.id && !expandedData && (
                <div className="border-t border-gray-100 p-8 flex justify-center">
                  <div className="animate-spin w-6 h-6 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Competition Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="font-heading font-bold text-xl mb-5">Competitie noua</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Campionatul National U14"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                    <select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                    >
                      <option value="turneu">Turneu</option>
                      <option value="liga">Liga</option>
                      <option value="cupa">Cupa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      placeholder="Ex: U14"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sezon</label>
                  <input
                    type="text"
                    value={form.season}
                    onChange={e => setForm({ ...form, season: e.target.value })}
                    placeholder="Ex: 2025-2026"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data inceput</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={e => setForm({ ...form, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data sfarsit</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={e => setForm({ ...form, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Descriere optionala..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Echipe (cate una pe linie)</label>
                  <textarea
                    value={form.teamsText}
                    onChange={e => setForm({ ...form, teamsText: e.target.value })}
                    rows={5}
                    placeholder={"Dinamo Bucuresti\nSteaua Bucuresti\nCSM Timisoara\n..."}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none font-mono"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-dinamo-red text-white px-6 py-2.5 rounded-lg font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Se salveaza...' : 'Creeaza competitia'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreateModal(false); setForm({ ...emptyForm }) }}
                    className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                  >
                    Anuleaza
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Competition Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="font-heading font-bold text-xl mb-5">Editeaza competitia</h2>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                    <select
                      value={editForm.type}
                      onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                    >
                      <option value="turneu">Turneu</option>
                      <option value="liga">Liga</option>
                      <option value="cupa">Cupa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sezon</label>
                  <input
                    type="text"
                    value={editForm.season}
                    onChange={e => setEditForm({ ...editForm, season: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data inceput</label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data sfarsit</label>
                    <input
                      type="date"
                      value={editForm.endDate}
                      onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-dinamo-red text-white px-6 py-2.5 rounded-lg font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Se salveaza...' : 'Salveaza modificarile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                  >
                    Anuleaza
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Match Modal */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMatchModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="font-heading font-bold text-xl mb-5">Adauga meci</h2>
              <form onSubmit={handleAddMatch} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                    <input
                      type="text"
                      value={matchForm.category}
                      onChange={e => setMatchForm({ ...matchForm, category: e.target.value })}
                      placeholder="Ex: U14"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Runda / Etapa</label>
                    <input
                      type="text"
                      value={matchForm.round}
                      onChange={e => setMatchForm({ ...matchForm, round: e.target.value })}
                      placeholder="Ex: Etapa 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data si ora *</label>
                  <input
                    type="datetime-local"
                    required
                    value={matchForm.date}
                    onChange={e => setMatchForm({ ...matchForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
                  <input
                    type="text"
                    value={matchForm.location}
                    onChange={e => setMatchForm({ ...matchForm, location: e.target.value })}
                    placeholder="Ex: Stadionul Dinamo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Echipa gazda *</label>
                    <input
                      type="text"
                      required
                      value={matchForm.homeTeam}
                      onChange={e => setMatchForm({ ...matchForm, homeTeam: e.target.value })}
                      placeholder="Echipa gazda"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Echipa oaspete *</label>
                    <input
                      type="text"
                      required
                      value={matchForm.awayTeam}
                      onChange={e => setMatchForm({ ...matchForm, awayTeam: e.target.value })}
                      placeholder="Echipa oaspete"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scor gazda</label>
                    <input
                      type="number"
                      min="0"
                      value={matchForm.homeScore}
                      onChange={e => setMatchForm({ ...matchForm, homeScore: e.target.value })}
                      placeholder="—"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scor oaspete</label>
                    <input
                      type="number"
                      min="0"
                      value={matchForm.awayScore}
                      onChange={e => setMatchForm({ ...matchForm, awayScore: e.target.value })}
                      placeholder="—"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                  <textarea
                    value={matchForm.notes}
                    onChange={e => setMatchForm({ ...matchForm, notes: e.target.value })}
                    rows={2}
                    placeholder="Observatii..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-dinamo-red text-white px-6 py-2.5 rounded-lg font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Se salveaza...' : 'Adauga meciul'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMatchModal(false)}
                    className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                  >
                    Anuleaza
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
