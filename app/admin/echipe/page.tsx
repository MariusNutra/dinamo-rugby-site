'use client'

import { useEffect, useState, useCallback } from 'react'
import { exportListaEchipa } from '@/lib/pdf-export'
import { Team, Coach, TrainingSession } from './_types'
import { emptySessionForm, emptyCoachForm, emptyNewTeamForm, dayOrder } from './_constants'
import { ColorPicker } from './_components/ColorPicker'
import { NewTeamForm } from './_components/NewTeamForm'
import { CoachesSection } from './_components/CoachesSection'
import { TrainingSessions } from './_components/TrainingSessions'

export default function AdminTeams() {
  const [activeTab, setActiveTab] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [teamForm, setTeamForm] = useState({ schedule: '', description: '', color: 'green', sortOrder: 0, ageRange: '', birthYear: '' })
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

  // New team form state
  const [showNewTeamForm, setShowNewTeamForm] = useState(false)
  const [newTeamForm, setNewTeamForm] = useState({ ...emptyNewTeamForm })
  const [savingNewTeam, setSavingNewTeam] = useState(false)
  const [newTeamError, setNewTeamError] = useState('')

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const loadTeams = () => fetch('/api/teams').then(r => r.json()).then((data: Team[]) => {
    setTeams(data)
    // Auto-select first tab if current tab doesn't exist
    if (data.length > 0 && !data.find(t => t.grupa === activeTab)) {
      setActiveTab(data[0].grupa)
    }
  })

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
    if (activeTab) {
      fetch(`/api/training?grupa=${activeTab}`).then(r => r.json()).then(setSessions)
    }
  }, [activeTab])

  useEffect(() => { loadTeams() }, [])

  useEffect(() => {
    if (!activeTab) return
    loadSessions()
    loadCoaches()
    if (currentTeam) {
      setTeamForm({
        schedule: currentTeam.schedule || '',
        description: currentTeam.description || '',
        color: currentTeam.color || 'green',
        sortOrder: currentTeam.sortOrder || 0,
        ageRange: currentTeam.ageRange || '',
        birthYear: currentTeam.birthYear || '',
      })
    } else {
      setTeamForm({ schedule: '', description: '', color: 'green', sortOrder: 0, ageRange: '', birthYear: '' })
    }
    // Reset editing states on tab change
    setEditingSessionId(null)
    setShowAddSession(false)
    setSessionError('')
    setEditingCoachId(null)
    setShowAddCoach(false)
    setShowDeleteConfirm(false)
    setDeleteConfirmText('')
  }, [activeTab, currentTeam, loadSessions, loadCoaches])

  // ── Save team info ──

  const saveTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/teams/${activeTab}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schedule: teamForm.schedule || null,
        description: teamForm.description || null,
        color: teamForm.color,
        sortOrder: teamForm.sortOrder,
        ageRange: teamForm.ageRange || null,
        birthYear: teamForm.birthYear || null,
      }),
    })
    setSaving(false)
    loadTeams()
  }

  // ── Create new team ──

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setNewTeamError('')
    if (!newTeamForm.grupa.trim()) {
      setNewTeamError('Numele grupei este obligatoriu.')
      return
    }
    if (teams.find(t => t.grupa === newTeamForm.grupa.trim())) {
      setNewTeamError('Există deja o echipă cu acest nume.')
      return
    }
    setSavingNewTeam(true)
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grupa: newTeamForm.grupa.trim(),
        coachName: '—',
        ageRange: newTeamForm.ageRange || null,
        birthYear: newTeamForm.birthYear || null,
        description: newTeamForm.description || null,
        color: newTeamForm.color,
        sortOrder: newTeamForm.sortOrder,
      }),
    })
    setSavingNewTeam(false)
    if (res.ok) {
      const created = await res.json()
      setShowNewTeamForm(false)
      setNewTeamForm({ ...emptyNewTeamForm })
      await loadTeams()
      setActiveTab(created.grupa)
    } else {
      setNewTeamError('Eroare la creare.')
    }
  }

  // ── Delete team ──

  const deleteTeam = async () => {
    if (!currentTeam || deleteConfirmText !== currentTeam.grupa) return
    await fetch(`/api/teams/${currentTeam.grupa}`, { method: 'DELETE' })
    setShowDeleteConfirm(false)
    setDeleteConfirmText('')
    setActiveTab('')
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

  const sortedSessions = [...sessions].sort((a, b) => (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Gestionare Echipe</h1>
        <button onClick={() => { setShowNewTeamForm(true); setNewTeamForm({ ...emptyNewTeamForm, sortOrder: teams.length + 1 }) }}
          className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-dinamo-dark transition-colors">
          + Echipă nouă
        </button>
      </div>

      {/* ══════ New team form ══════ */}
      {showNewTeamForm && (
        <NewTeamForm
          newTeamForm={newTeamForm}
          setNewTeamForm={setNewTeamForm}
          createTeam={createTeam}
          savingNewTeam={savingNewTeam}
          newTeamError={newTeamError}
          setShowNewTeamForm={setShowNewTeamForm}
          setNewTeamError={setNewTeamError}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {teams.map(t => (
          <button key={t.grupa} onClick={() => setActiveTab(t.grupa)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors shrink-0 ${
              activeTab === t.grupa ? 'bg-dinamo-red text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${!t.active ? 'opacity-50' : ''}`}>
            {t.grupa}
            {!t.active && <span className="ml-1 text-xs font-normal">(inactivă)</span>}
          </button>
        ))}
      </div>

      {!currentTeam && teams.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
          Selectează o echipă din lista de mai sus.
        </div>
      )}

      {teams.length === 0 && !showNewTeamForm && (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
          Nu există echipe. Creează prima echipă cu butonul de mai sus.
        </div>
      )}

      {currentTeam && (
        <>
          {/* ══════ Active toggle + Delete ══════ */}
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
            <div className="flex items-center gap-2">
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
              <button onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors">
                Șterge echipa
              </button>
            </div>
          </div>

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-red-800 mb-2">Ești sigur?</h3>
              <p className="text-red-700 text-sm mb-4">
                Aceasta va șterge echipa <strong>{currentTeam.grupa}</strong> și toți antrenorii, meciurile și antrenamentele asociate. Acțiunea este ireversibilă.
              </p>
              <div className="flex items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-red-700 mb-1">
                    Scrie &quot;{currentTeam.grupa}&quot; pentru a confirma:
                  </label>
                  <input type="text" value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    className="px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder={currentTeam.grupa} />
                </div>
                <button onClick={deleteTeam}
                  disabled={deleteConfirmText !== currentTeam.grupa}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-30">
                  Confirmă ștergerea
                </button>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                  Anulează
                </button>
              </div>
            </div>
          )}

          {/* ══════ Coaches section ══════ */}
          <CoachesSection
            activeTab={activeTab}
            coaches={coaches}
            showAddCoach={showAddCoach}
            editingCoachId={editingCoachId}
            coachForm={coachForm}
            setCoachForm={setCoachForm}
            savingCoach={savingCoach}
            startAddCoach={startAddCoach}
            saveCoach={saveCoach}
            cancelCoachForm={cancelCoachForm}
            handleCoachPhotoUpload={handleCoachPhotoUpload}
            startEditCoach={startEditCoach}
            deleteCoach={deleteCoach}
            moveCoach={moveCoach}
          />

          {/* ══════ Team info (color, order, age, schedule, description) ══════ */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="font-heading font-bold text-lg mb-4">Informații echipă {activeTab}</h2>
            <form onSubmit={saveTeam} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vârstă range</label>
                  <input type="text" value={teamForm.ageRange} placeholder="ex: 8-10 ani"
                    onChange={e => setTeamForm({ ...teamForm, ageRange: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anul nașterii</label>
                  <input type="text" value={teamForm.birthYear} placeholder="ex: 2015-2016"
                    onChange={e => setTeamForm({ ...teamForm, birthYear: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordine afișare</label>
                  <input type="number" value={teamForm.sortOrder}
                    onChange={e => setTeamForm({ ...teamForm, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Culoare card</label>
                <ColorPicker value={teamForm.color} onChange={color => setTeamForm({ ...teamForm, color })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program antrenamente (text)</label>
                <textarea rows={3} value={teamForm.schedule}
                  onChange={e => setTeamForm({ ...teamForm, schedule: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none"
                  placeholder="Luni: 16:00-18:00 — Stadion Dinamo" />
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
          <TrainingSessions
            activeTab={activeTab}
            sortedSessions={sortedSessions}
            showAddSession={showAddSession}
            editingSessionId={editingSessionId}
            sessionForm={sessionForm}
            setSessionForm={setSessionForm}
            sessionError={sessionError}
            savingSession={savingSession}
            scheduleText={teamForm.schedule}
            startAddSession={startAddSession}
            saveSession={saveSession}
            cancelSessionForm={cancelSessionForm}
            startEditSession={startEditSession}
            deleteSession={deleteSession}
          />

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

          {/* Export PDF Lista Echipa */}
          <div className="bg-white rounded-xl shadow-md p-6 mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-lg">Export Lista {activeTab}</h2>
              <button
                onClick={async () => {
                  if (!currentTeam) return
                  const res = await fetch(`/api/admin/export/echipa?teamId=${currentTeam.id}`)
                  if (res.ok) {
                    const data = await res.json()
                    exportListaEchipa(data)
                  }
                }}
                className="px-4 py-2 bg-dinamo-blue text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Export PDF Lista
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-2">Generează un PDF cu lista jucătorilor din echipă.</p>
          </div>
        </>
      )}
    </div>
  )
}
