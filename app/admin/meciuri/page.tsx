'use client'

import { useEffect, useState, useCallback } from 'react'
import { TEAMS, STADIUMS, MATCH_TYPES, CATEGORIES, getDefaultHomeTeam, isDinamoTeam } from '@/lib/teams'
import type { Category } from '@/lib/teams'

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
}

type FilterCategory = Category | 'Toate'

const emptyForm = {
  category: 'U10' as Category,
  matchType: 'turneu',
  round: '',
  date: '',
  location: '',
  locationCustom: '',
  homeTeam: '',
  homeTeamCustom: '',
  awayTeam: '',
  awayTeamCustom: '',
  homeScore: '',
  awayScore: '',
  isDinamo: true,
  notes: '',
}

export default function AdminMeciuri() {
  const [matches, setMatches] = useState<Match[]>([])
  const [filter, setFilter] = useState<FilterCategory>('Toate')
  const [form, setForm] = useState({ ...emptyForm, homeTeam: getDefaultHomeTeam('U10') })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [quickScoreId, setQuickScoreId] = useState<string | null>(null)
  const [quickScore, setQuickScore] = useState({ home: '', away: '' })

  const loadMatches = useCallback(() => {
    const url = filter === 'Toate' ? '/api/matches' : `/api/matches?category=${filter}`
    fetch(url).then(r => r.json()).then(setMatches)
  }, [filter])

  useEffect(() => { loadMatches() }, [loadMatches])

  // Auto-detect isDinamo when teams change
  const resolveHomeTeam = form.homeTeam === '__custom__' ? form.homeTeamCustom : form.homeTeam
  const resolveAwayTeam = form.awayTeam === '__custom__' ? form.awayTeamCustom : form.awayTeam
  const autoIsDinamo = isDinamoTeam(resolveHomeTeam) || isDinamoTeam(resolveAwayTeam)

  useEffect(() => {
    setForm(prev => ({ ...prev, isDinamo: autoIsDinamo }))
  }, [autoIsDinamo])

  const resetForm = () => {
    const cat = form.category
    setForm({ ...emptyForm, category: cat, homeTeam: getDefaultHomeTeam(cat) })
    setEditingId(null)
    setShowForm(false)
  }

  const handleCategoryChange = (cat: Category) => {
    setForm(prev => ({
      ...prev,
      category: cat,
      homeTeam: getDefaultHomeTeam(cat),
      homeTeamCustom: '',
      awayTeam: '',
      awayTeamCustom: '',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const resolvedLocation = form.location === '__custom__' ? form.locationCustom : form.location
    const payload = {
      category: form.category,
      matchType: form.matchType,
      round: form.round || null,
      date: form.date,
      location: resolvedLocation || null,
      homeTeam: resolveHomeTeam,
      awayTeam: resolveAwayTeam,
      homeScore: form.homeScore !== '' ? form.homeScore : null,
      awayScore: form.awayScore !== '' ? form.awayScore : null,
      isDinamo: form.isDinamo,
      notes: form.notes || null,
    }

    if (editingId) {
      await fetch(`/api/matches/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    setSaving(false)
    resetForm()
    loadMatches()
  }

  const startEdit = (match: Match) => {
    const teams = TEAMS[match.category as Category] || []
    const isHomeCustom = !teams.includes(match.homeTeam)
    const isAwayCustom = !teams.includes(match.awayTeam)
    const isLocationCustom = match.location ? !STADIUMS.includes(match.location) : false

    setForm({
      category: match.category as Category,
      matchType: match.matchType,
      round: match.round || '',
      date: match.date.slice(0, 16),
      location: isLocationCustom ? '__custom__' : (match.location || ''),
      locationCustom: isLocationCustom ? (match.location || '') : '',
      homeTeam: isHomeCustom ? '__custom__' : match.homeTeam,
      homeTeamCustom: isHomeCustom ? match.homeTeam : '',
      awayTeam: isAwayCustom ? '__custom__' : match.awayTeam,
      awayTeamCustom: isAwayCustom ? match.awayTeam : '',
      homeScore: match.homeScore != null ? String(match.homeScore) : '',
      awayScore: match.awayScore != null ? String(match.awayScore) : '',
      isDinamo: match.isDinamo,
      notes: match.notes || '',
    })
    setEditingId(match.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteMatch = async (id: string) => {
    if (!confirm('Sigur vrei să ștergi acest meci?')) return
    await fetch(`/api/matches/${id}`, { method: 'DELETE' })
    loadMatches()
  }

  const submitQuickScore = async (id: string) => {
    await fetch(`/api/matches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeScore: quickScore.home,
        awayScore: quickScore.away,
      }),
    })
    setQuickScoreId(null)
    setQuickScore({ home: '', away: '' })
    loadMatches()
  }

  const currentTeams = TEAMS[form.category] || []

  const withoutScore = matches.filter(m => m.homeScore == null)
  const withScore = matches.filter(m => m.homeScore != null)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Meciuri U10-U14</h1>
        <button
          onClick={() => { setShowForm(!showForm); if (editingId) resetForm() }}
          className="bg-dinamo-red text-white px-5 py-2 rounded-lg font-bold hover:bg-dinamo-dark transition-colors text-sm"
        >
          {showForm ? 'Anulează' : '+ Adaugă meci'}
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-dinamo-red">
          <h2 className="font-heading font-bold text-lg mb-4">
            {editingId ? 'Editează meci' : 'Meci nou'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie *</label>
                <select
                  value={form.category}
                  onChange={e => handleCategoryChange(e.target.value as Category)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Match type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                <select
                  value={form.matchType}
                  onChange={e => setForm({ ...form, matchType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                >
                  {MATCH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Round */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rundă / Etapă</label>
                <input
                  type="text"
                  placeholder="Ex: Etapa 1, Festival Arcul de Triumf"
                  value={form.round}
                  onChange={e => setForm({ ...form, round: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data și ora *</label>
                <input
                  type="datetime-local"
                  required
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                />
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Locație</label>
                <select
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value, locationCustom: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                >
                  <option value="">— Selectează stadionul —</option>
                  {STADIUMS.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="__custom__">Alta...</option>
                </select>
                {form.location === '__custom__' && (
                  <input
                    type="text"
                    placeholder="Introdu locația"
                    value={form.locationCustom}
                    onChange={e => setForm({ ...form, locationCustom: e.target.value })}
                    className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  />
                )}
              </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home team */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Echipa gazdă *</label>
                <select
                  value={form.homeTeam}
                  onChange={e => setForm({ ...form, homeTeam: e.target.value, homeTeamCustom: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                >
                  <option value="">— Selectează echipa —</option>
                  {currentTeams.map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="__custom__">Altă echipă...</option>
                </select>
                {form.homeTeam === '__custom__' && (
                  <input
                    type="text"
                    required
                    placeholder="Numele echipei"
                    value={form.homeTeamCustom}
                    onChange={e => setForm({ ...form, homeTeamCustom: e.target.value })}
                    className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  />
                )}
              </div>

              {/* Away team */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Echipa oaspete *</label>
                <select
                  value={form.awayTeam}
                  onChange={e => setForm({ ...form, awayTeam: e.target.value, awayTeamCustom: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                >
                  <option value="">— Selectează echipa —</option>
                  {currentTeams.map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="__custom__">Altă echipă...</option>
                </select>
                {form.awayTeam === '__custom__' && (
                  <input
                    type="text"
                    required
                    placeholder="Numele echipei"
                    value={form.awayTeamCustom}
                    onChange={e => setForm({ ...form, awayTeamCustom: e.target.value })}
                    className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  />
                )}
              </div>
            </div>

            {/* Score + isDinamo + Notes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scor gazdă</label>
                <input
                  type="number"
                  min="0"
                  placeholder="—"
                  value={form.homeScore}
                  onChange={e => setForm({ ...form, homeScore: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scor oaspete</label>
                <input
                  type="number"
                  min="0"
                  placeholder="—"
                  value={form.awayScore}
                  onChange={e => setForm({ ...form, awayScore: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={form.isDinamo}
                    onChange={e => setForm({ ...form, isDinamo: e.target.checked })}
                    className="w-4 h-4 accent-dinamo-red"
                  />
                  <span className="text-sm text-gray-700">Meci Dinamo</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                placeholder="Observații, detalii..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-dinamo-red text-white px-6 py-2 rounded-lg font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
              >
                {saving ? 'Se salvează...' : editingId ? 'Salvează modificările' : '+ Adaugă meci'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                >
                  Anulează
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['Toate', ...CATEGORIES] as FilterCategory[]).map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors shrink-0 ${
              filter === c ? 'bg-dinamo-red text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Match list */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {matches.length === 0 ? (
          <p className="text-gray-400 text-center py-12">Nu sunt meciuri.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Cat.</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Rundă</th>
                  <th className="px-4 py-3">Meci</th>
                  <th className="px-4 py-3 text-center">Scor</th>
                  <th className="px-4 py-3 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {/* Matches without score first */}
                {withoutScore.length > 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-2 bg-amber-50 text-amber-800 text-xs font-bold uppercase">
                      De completat ({withoutScore.length})
                    </td>
                  </tr>
                )}
                {withoutScore.map(match => (
                  <MatchRow
                    key={match.id}
                    match={match}
                    quickScoreId={quickScoreId}
                    quickScore={quickScore}
                    setQuickScoreId={setQuickScoreId}
                    setQuickScore={setQuickScore}
                    submitQuickScore={submitQuickScore}
                    onEdit={startEdit}
                    onDelete={deleteMatch}
                  />
                ))}
                {/* Matches with score */}
                {withScore.length > 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-2 bg-gray-50 text-gray-600 text-xs font-bold uppercase">
                      Rezultate ({withScore.length})
                    </td>
                  </tr>
                )}
                {withScore.map(match => (
                  <MatchRow
                    key={match.id}
                    match={match}
                    quickScoreId={quickScoreId}
                    quickScore={quickScore}
                    setQuickScoreId={setQuickScoreId}
                    setQuickScore={setQuickScore}
                    submitQuickScore={submitQuickScore}
                    onEdit={startEdit}
                    onDelete={deleteMatch}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function MatchRow({
  match,
  quickScoreId,
  quickScore,
  setQuickScoreId,
  setQuickScore,
  submitQuickScore,
  onEdit,
  onDelete,
}: {
  match: Match
  quickScoreId: string | null
  quickScore: { home: string; away: string }
  setQuickScoreId: (id: string | null) => void
  setQuickScore: (s: { home: string; away: string }) => void
  submitQuickScore: (id: string) => void
  onEdit: (m: Match) => void
  onDelete: (id: string) => void
}) {
  const catColors: Record<string, string> = {
    U10: 'bg-green-100 text-green-800',
    U12: 'bg-blue-100 text-blue-800',
    U14: 'bg-red-100 text-red-800',
  }

  const hasScore = match.homeScore != null
  const isQuickEditing = quickScoreId === match.id

  return (
    <tr className={`border-b border-gray-100 ${match.isDinamo ? 'bg-red-50/40' : ''}`}>
      <td className="px-4 py-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${catColors[match.category] || ''}`}>
          {match.category}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
        {new Date(match.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })}
        <br />
        <span className="text-xs text-gray-400">
          {new Date(match.date).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {match.round || '—'}
      </td>
      <td className="px-4 py-3">
        <span className={match.isDinamo ? 'font-semibold' : ''}>{match.homeTeam}</span>
        <span className="mx-1 text-gray-400">vs</span>
        <span className={match.isDinamo ? 'font-semibold' : ''}>{match.awayTeam}</span>
        {match.location && (
          <div className="text-xs text-gray-400 mt-0.5">@ {match.location}</div>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {isQuickEditing ? (
          <div className="flex items-center gap-1 justify-center">
            <input
              type="number"
              min="0"
              value={quickScore.home}
              onChange={e => setQuickScore({ ...quickScore, home: e.target.value })}
              className="w-12 px-1 py-1 border rounded text-center text-sm"
              autoFocus
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              min="0"
              value={quickScore.away}
              onChange={e => setQuickScore({ ...quickScore, away: e.target.value })}
              className="w-12 px-1 py-1 border rounded text-center text-sm"
            />
            <button
              onClick={() => submitQuickScore(match.id)}
              className="text-green-600 hover:bg-green-50 px-1.5 py-1 rounded text-xs font-bold"
            >
              OK
            </button>
            <button
              onClick={() => setQuickScoreId(null)}
              className="text-gray-400 hover:bg-gray-100 px-1.5 py-1 rounded text-xs"
            >
              X
            </button>
          </div>
        ) : hasScore ? (
          <span className="font-bold">{match.homeScore} - {match.awayScore}</span>
        ) : (
          <button
            onClick={() => {
              setQuickScoreId(match.id)
              setQuickScore({ home: '', away: '' })
            }}
            className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded font-medium hover:bg-amber-200 transition-colors"
          >
            + Scor
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <button
          onClick={() => onEdit(match)}
          className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(match.id)}
          className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium ml-1"
        >
          Șterge
        </button>
      </td>
    </tr>
  )
}
