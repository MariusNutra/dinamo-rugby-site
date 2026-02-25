'use client'

import { useEffect, useState, useCallback } from 'react'
import ImageUpload from '@/components/ImageUpload'

interface Team {
  id: number
  grupa: string
  coachName: string
  coachPhoto: string | null
  coachBio: string | null
  schedule: string | null
  description: string | null
  active: boolean
}

interface Coach {
  id: string
  name: string
  description: string | null
  photo: string | null
  order: number
  teamId: number
}

interface TrainingSession {
  id: number
  grupa: string
  day: string
  startTime: string
  endTime: string
  location: string
  coachName: string | null
}

const grupe = ['U10', 'U12', 'U14', 'U16', 'U18']
const days = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică']

const emptySessionForm = { day: 'Luni', startTime: '16:00', endTime: '18:00', location: '', coachName: '' }
const emptyCoachForm = { name: '', description: '', photo: '' }

export default function AdminTeams() {
  const [activeTab, setActiveTab] = useState('U10')
  const [teams, setTeams] = useState<Team[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [teamForm, setTeamForm] = useState({ schedule: '', description: '' })
  const [saving, setSaving] = useState(false)

  // Coach form state
  const [coachForm, setCoachForm] = useState({ ...emptyCoachForm })
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null)
  const [showAddCoach, setShowAddCoach] = useState(false)
  const [savingCoach, setSavingCoach] = useState(false)

  // Session form state
  const [sessionForm, setSessionForm] = useState({ ...emptySessionForm })
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [showAddSession, setShowAddSession] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [savingSession, setSavingSession] = useState(false)
  const [togglingActive, setTogglingActive] = useState(false)

  const loadTeams = () => fetch('/api/teams').then(r => r.json()).then(setTeams)

  const toggleActive = async (grupa: string, currentActive: boolean) => {
    const action = currentActive ? 'dezactiva' : 'activa'
    if (!confirm(`Sigur vrei să ${action} echipa ${grupa}? ${currentActive ? 'Echipa nu va mai fi vizibilă pe site.' : 'Echipa va redeveni vizibilă pe site.'}`)) return
    setTogglingActive(true)
    await fetch(`/api/teams/${grupa}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !currentActive }),
    })
    setTogglingActive(false)
    loadTeams()
  }

  const currentTeam = teams.find(t => t.grupa === activeTab)

  const loadCoaches = useCallback(() => {
    if (currentTeam) {
      fetch(`/api/coaches?teamId=${currentTeam.id}`).then(r => r.json()).then(setCoaches)
    } else {
      setCoaches([])
    }
  }, [currentTeam])

  const loadSessions = useCallback(() => {
    fetch(`/api/training?grupa=${activeTab}`).then(r => r.json()).then(setSessions)
  }, [activeTab])

  useEffect(() => { loadTeams() }, [])

  useEffect(() => {
    loadSessions()
    loadCoaches()
    if (currentTeam) {
      setTeamForm({
        schedule: currentTeam.schedule || '',
        description: currentTeam.description || '',
      })
    } else {
      setTeamForm({ schedule: '', description: '' })
    }
    // Reset editing states on tab change
    setEditingSessionId(null)
    setShowAddSession(false)
    setSessionError('')
    setEditingCoachId(null)
    setShowAddCoach(false)
  }, [activeTab, currentTeam, loadSessions, loadCoaches])

  const saveTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    // Keep existing coachName so the Team model stays valid
    await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grupa: activeTab,
        coachName: currentTeam?.coachName || '—',
        coachPhoto: currentTeam?.coachPhoto || null,
        coachBio: currentTeam?.coachBio || null,
        ...teamForm,
      }),
    })
    setSaving(false)
    loadTeams()
  }

  // ── Coach CRUD ──

  const handleCoachPhotoUpload = async (files: File[]) => {
    const fd = new FormData()
    fd.append('files', files[0])
    const res = await fetch('/api/photos', { method: 'POST', body: fd })
    const photos = await res.json()
    if (photos[0]) setCoachForm(f => ({ ...f, photo: photos[0].path }))
  }

  const startAddCoach = () => {
    setCoachForm({ ...emptyCoachForm })
    setEditingCoachId(null)
    setShowAddCoach(true)
  }

  const startEditCoach = (c: Coach) => {
    setCoachForm({ name: c.name, description: c.description || '', photo: c.photo || '' })
    setEditingCoachId(c.id)
    setShowAddCoach(false)
  }

  const cancelCoachForm = () => {
    setEditingCoachId(null)
    setShowAddCoach(false)
  }

  const saveCoach = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTeam) return
    setSavingCoach(true)

    const payload = {
      name: coachForm.name,
      description: coachForm.description || null,
      photo: coachForm.photo || null,
      teamId: currentTeam.id,
    }

    if (editingCoachId) {
      await fetch(`/api/coaches/${editingCoachId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    setSavingCoach(false)
    cancelCoachForm()
    loadCoaches()
  }

  const deleteCoach = async (id: string) => {
    if (!confirm('Sigur vrei să ștergi acest antrenor?')) return
    await fetch(`/api/coaches/${id}`, { method: 'DELETE' })
    loadCoaches()
  }

  const moveCoach = async (id: string, direction: 'up' | 'down') => {
    const idx = coaches.findIndex(c => c.id === id)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= coaches.length) return

    const newOrder = [...coaches]
    const temp = newOrder[idx]
    newOrder[idx] = newOrder[swapIdx]
    newOrder[swapIdx] = temp

    // Optimistic update
    setCoaches(newOrder)

    await fetch('/api/coaches/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: newOrder.map(c => c.id) }),
    })
    loadCoaches()
  }

  // ── Session CRUD ──

  const startAddSession = () => {
    setSessionForm({ ...emptySessionForm })
    setEditingSessionId(null)
    setShowAddSession(true)
    setSessionError('')
  }

  const startEditSession = (s: TrainingSession) => {
    setSessionForm({
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      location: s.location,
      coachName: s.coachName || '',
    })
    setEditingSessionId(s.id)
    setShowAddSession(false)
    setSessionError('')
  }

  const cancelSessionForm = () => {
    setEditingSessionId(null)
    setShowAddSession(false)
    setSessionError('')
  }

  const saveSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setSessionError('')

    if (sessionForm.endTime <= sessionForm.startTime) {
      setSessionError('Ora de sfârșit trebuie să fie după ora de început.')
      return
    }

    setSavingSession(true)
    const payload = { grupa: activeTab, ...sessionForm, coachName: sessionForm.coachName || null }

    const url = editingSessionId ? `/api/training/${editingSessionId}` : '/api/training'
    const method = editingSessionId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json()
      setSessionError(err.error || 'Eroare la salvare.')
      setSavingSession(false)
      return
    }

    setSavingSession(false)
    cancelSessionForm()
    loadSessions()
  }

  const deleteSession = async (id: number) => {
    if (!confirm('Sigur vrei să ștergi această sesiune?')) return
    await fetch(`/api/training/${id}`, { method: 'DELETE' })
    loadSessions()
  }

  // Sort sessions by day order
  const dayOrder: Record<string, number> = {
    'Luni': 1, 'Marți': 2, 'Miercuri': 3, 'Joi': 4, 'Vineri': 5, 'Sâmbătă': 6, 'Duminică': 7,
  }
  const sortedSessions = [...sessions].sort((a, b) => (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99))

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Gestionare Echipe</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {grupe.map(g => {
          const team = teams.find(t => t.grupa === g)
          const isInactive = team && !team.active
          return (
            <button key={g} onClick={() => setActiveTab(g)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors shrink-0 ${
                activeTab === g ? 'bg-dinamo-red text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isInactive ? 'opacity-50' : ''}`}>
              {g}
              {isInactive && <span className="ml-1 text-xs font-normal">(inactivă)</span>}
            </button>
          )
        })}
      </div>

      {/* ══════ Active toggle ══════ */}
      {currentTeam && (
        <div className={`rounded-xl shadow-md p-4 mb-8 flex items-center justify-between ${currentTeam.active ? 'bg-white' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              currentTeam.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {currentTeam.active ? 'Activă' : 'Inactivă'}
            </span>
            <span className="text-sm text-gray-600">
              {currentTeam.active
                ? 'Echipa este vizibilă pe site.'
                : 'Echipa nu este vizibilă pe site. Toate datele sunt păstrate.'}
            </span>
          </div>
          <button
            onClick={() => toggleActive(currentTeam.grupa, currentTeam.active)}
            disabled={togglingActive}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 ${
              currentTeam.active
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}>
            {togglingActive ? 'Se procesează...' : currentTeam.active ? 'Dezactivează' : 'Activează'}
          </button>
        </div>
      )}

      {/* ══════ Coaches section ══════ */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg">Antrenori — {activeTab}</h2>
          {!showAddCoach && editingCoachId === null && (
            <button onClick={startAddCoach}
              className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-dinamo-dark transition-colors">
              + Adaugă antrenor
            </button>
          )}
        </div>

        {/* Add / Edit coach form */}
        {(showAddCoach || editingCoachId !== null) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border-l-4 border-dinamo-red">
            <h3 className="font-medium text-sm text-gray-700 mb-3">
              {editingCoachId ? 'Editează antrenor' : 'Antrenor nou'}
            </h3>
            <form onSubmit={saveCoach} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nume antrenor *</label>
                  <input type="text" required value={coachForm.name}
                    onChange={e => setCoachForm({ ...coachForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Poză antrenor</label>
                  {coachForm.photo ? (
                    <div className="flex items-center gap-2">
                      <img src={coachForm.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                      <button type="button" onClick={() => setCoachForm({ ...coachForm, photo: '' })}
                        className="text-red-500 text-xs">Elimină</button>
                    </div>
                  ) : (
                    <ImageUpload onUpload={handleCoachPhotoUpload} multiple={false} label="Încarcă poză" />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descriere</label>
                <textarea rows={3} value={coachForm.description}
                  onChange={e => setCoachForm({ ...coachForm, description: e.target.value })}
                  placeholder="Experiență, certificări, filosofie..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingCoach}
                  className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50">
                  {savingCoach ? 'Se salvează...' : editingCoachId ? 'Salvează' : '+ Adaugă'}
                </button>
                <button type="button" onClick={cancelCoachForm}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors">
                  Anulează
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coaches list */}
        {coaches.length > 0 ? (
          <div className="space-y-2">
            {coaches.map((c, idx) => (
              <div key={c.id} className={`flex items-center justify-between rounded-lg p-3 ${
                editingCoachId === c.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {c.photo ? (
                    <img src={c.photo} alt={c.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg shrink-0">?</div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                    {c.description && (
                      <p className="text-xs text-gray-500 truncate max-w-[300px]">
                        {c.description.length > 100 ? c.description.substring(0, 100) + '...' : c.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => moveCoach(c.id, 'up')} disabled={idx === 0}
                    className="text-gray-400 hover:text-gray-700 px-1 py-1 rounded text-xs disabled:opacity-30"
                    title="Mută sus">▲</button>
                  <button onClick={() => moveCoach(c.id, 'down')} disabled={idx === coaches.length - 1}
                    className="text-gray-400 hover:text-gray-700 px-1 py-1 rounded text-xs disabled:opacity-30"
                    title="Mută jos">▼</button>
                  <button onClick={() => startEditCoach(c)}
                    className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium">
                    Editează
                  </button>
                  <button onClick={() => deleteCoach(c.id)}
                    className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium">
                    Șterge
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4 text-sm">
            Nu sunt antrenori adăugați pentru {activeTab}.
          </p>
        )}
      </div>

      {/* ══════ Team info (schedule + description) ══════ */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="font-heading font-bold text-lg mb-4">Informații echipă {activeTab}</h2>
        <form onSubmit={saveTeam} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program antrenamente (text)</label>
            <textarea rows={3} value={teamForm.schedule}
              onChange={e => setTeamForm({ ...teamForm, schedule: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none"
              placeholder="Luni: 16:00-18:00 — Stadion Dinamo&#10;Miercuri: 16:00-18:00 — Stadion Dinamo&#10;Vineri: 16:00-18:00 — Stadion Dinamo" />
            <p className="text-xs text-blue-600 mt-1 flex items-start gap-1">
              <span>ℹ️</span>
              <span>Programul afișat pe site vine prioritar din sesiunile de antrenament de mai jos. Acest câmp este folosit doar ca fallback dacă nu există sesiuni.</span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descriere echipă</label>
            <textarea rows={3} value={teamForm.description}
              onChange={e => setTeamForm({ ...teamForm, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none" />
          </div>
          <button type="submit" disabled={saving}
            className="bg-dinamo-red text-white px-6 py-2 rounded-lg font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50">
            {saving ? 'Se salvează...' : 'Salvează informațiile'}
          </button>
        </form>
      </div>

      {/* ══════ Training sessions ══════ */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg">Sesiuni antrenament — {activeTab}</h2>
          {!showAddSession && !editingSessionId && (
            <button onClick={startAddSession}
              className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-dinamo-dark transition-colors">
              + Adaugă sesiune
            </button>
          )}
        </div>

        {/* Add / Edit session form */}
        {(showAddSession || editingSessionId !== null) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border-l-4 border-dinamo-red">
            <h3 className="font-medium text-sm text-gray-700 mb-3">
              {editingSessionId ? 'Editează sesiune' : 'Sesiune nouă'}
            </h3>
            <form onSubmit={saveSession} className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ziua</label>
                  <select value={sessionForm.day}
                    onChange={e => setSessionForm({ ...sessionForm, day: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none">
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ora start</label>
                  <input type="time" required value={sessionForm.startTime}
                    onChange={e => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ora end</label>
                  <input type="time" required value={sessionForm.endTime}
                    onChange={e => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Locația</label>
                  <input type="text" required placeholder="Stadionul Dinamo" value={sessionForm.location}
                    onChange={e => setSessionForm({ ...sessionForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Antrenor</label>
                  <input type="text" placeholder="(opțional)" value={sessionForm.coachName}
                    onChange={e => setSessionForm({ ...sessionForm, coachName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
                </div>
              </div>
              {sessionError && (
                <p className="text-red-600 text-sm">{sessionError}</p>
              )}
              <div className="flex gap-2">
                <button type="submit" disabled={savingSession}
                  className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50">
                  {savingSession ? 'Se salvează...' : editingSessionId ? 'Salvează' : '+ Adaugă'}
                </button>
                <button type="button" onClick={cancelSessionForm}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors">
                  Anulează
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sessions list */}
        {sortedSessions.length > 0 ? (
          <div className="space-y-2">
            {sortedSessions.map(s => (
              <div key={s.id} className={`flex items-center justify-between rounded-lg p-3 ${
                editingSessionId === s.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-4 flex-wrap text-sm">
                  <span className="font-medium text-gray-900 min-w-[80px]">{s.day}</span>
                  <span className="text-gray-700">{s.startTime} - {s.endTime}</span>
                  <span className="text-gray-500">@ {s.location}</span>
                  {s.coachName && <span className="text-gray-400">({s.coachName})</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEditSession(s)}
                    className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium">
                    Editează
                  </button>
                  <button onClick={() => deleteSession(s.id)}
                    className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium">
                    Șterge
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4 text-sm">
            Nu sunt sesiuni de antrenament pentru {activeTab}.
            {teamForm.schedule && ' Se afișează câmpul text ca fallback pe site.'}
          </p>
        )}
      </div>

      {/* Link to matches management */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg">Meciuri {activeTab}</h2>
          <a href="/admin/meciuri" className="text-dinamo-red hover:text-dinamo-dark font-medium text-sm">
            Gestionează meciuri →
          </a>
        </div>
        <p className="text-gray-500 text-sm mt-2">Meciurile se gestionează din pagina dedicată.</p>
      </div>
    </div>
  )
}
