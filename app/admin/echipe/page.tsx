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

export default function AdminTeams() {
  const [activeTab, setActiveTab] = useState('U10')
  const [teams, setTeams] = useState<Team[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [teamForm, setTeamForm] = useState({ coachName: '', coachPhoto: '', coachBio: '', schedule: '', description: '' })
  const [saving, setSaving] = useState(false)

  // Session form state
  const [sessionForm, setSessionForm] = useState({ ...emptySessionForm })
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [showAddSession, setShowAddSession] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [savingSession, setSavingSession] = useState(false)

  const loadTeams = () => fetch('/api/teams').then(r => r.json()).then(setTeams)
  const loadSessions = useCallback(() => {
    fetch(`/api/training?grupa=${activeTab}`).then(r => r.json()).then(setSessions)
  }, [activeTab])

  useEffect(() => { loadTeams() }, [])
  useEffect(() => {
    loadSessions()
    const team = teams.find(t => t.grupa === activeTab)
    if (team) {
      setTeamForm({
        coachName: team.coachName || '',
        coachPhoto: team.coachPhoto || '',
        coachBio: team.coachBio || '',
        schedule: team.schedule || '',
        description: team.description || '',
      })
    } else {
      setTeamForm({ coachName: '', coachPhoto: '', coachBio: '', schedule: '', description: '' })
    }
    // Reset session editing state on tab change
    setEditingSessionId(null)
    setShowAddSession(false)
    setSessionError('')
  }, [activeTab, teams, loadSessions])

  const handleCoachPhotoUpload = async (files: File[]) => {
    const fd = new FormData()
    fd.append('files', files[0])
    const res = await fetch('/api/photos', { method: 'POST', body: fd })
    const photos = await res.json()
    if (photos[0]) setTeamForm(f => ({ ...f, coachPhoto: photos[0].path }))
  }

  const saveTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grupa: activeTab, ...teamForm, coachPhoto: teamForm.coachPhoto || null }),
    })
    setSaving(false)
    loadTeams()
  }

  // Session CRUD
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
        {grupe.map(g => (
          <button key={g} onClick={() => setActiveTab(g)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors shrink-0 ${
              activeTab === g ? 'bg-dinamo-red text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {g}
          </button>
        ))}
      </div>

      {/* Team info */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="font-heading font-bold text-lg mb-4">Informații echipă {activeTab}</h2>
        <form onSubmit={saveTeam} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nume antrenor</label>
              <input type="text" required value={teamForm.coachName}
                onChange={e => setTeamForm({ ...teamForm, coachName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poză antrenor</label>
              {teamForm.coachPhoto ? (
                <div className="flex items-center gap-2">
                  <img src={teamForm.coachPhoto} alt="" className="w-12 h-12 rounded-full object-cover" />
                  <button type="button" onClick={() => setTeamForm({ ...teamForm, coachPhoto: '' })}
                    className="text-red-500 text-sm">Elimină</button>
                </div>
              ) : (
                <ImageUpload onUpload={handleCoachPhotoUpload} multiple={false} label="Încarcă poză" />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descriere antrenor</label>
            <textarea rows={3} value={teamForm.coachBio}
              onChange={e => setTeamForm({ ...teamForm, coachBio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none" />
          </div>
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

      {/* Training sessions */}
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

        {/* Add / Edit form */}
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
