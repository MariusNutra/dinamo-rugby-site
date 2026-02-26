'use client'

import { useState, useEffect } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

interface CalendarEvent {
  id: string
  title: string
  type: 'match' | 'training' | 'event'
  date: string
  startTime: string | null
  endTime: string | null
  location: string | null
  description: string | null
  teamId: string | null
  createdAt: string
}

interface Team {
  id: string
  name: string
}

const EVENT_TYPE_OPTIONS = [
  { value: 'match', label: 'Meci' },
  { value: 'training', label: 'Antrenament' },
  { value: 'event', label: 'Eveniment' },
]

const TYPE_BADGE: Record<string, string> = {
  match: 'bg-red-100 text-red-700',
  training: 'bg-blue-100 text-blue-700',
  event: 'bg-green-100 text-green-700',
}

const TYPE_LABEL: Record<string, string> = {
  match: 'Meci',
  training: 'Antrenament',
  event: 'Eveniment',
}

export default function AdminCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'match' | 'training' | 'event'>('match')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [teamId, setTeamId] = useState('')

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadEvents = () => {
    fetch('/api/admin/calendar')
      .then(r => r.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const loadTeams = () => {
    fetch('/api/teams')
      .then(r => r.json())
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => {})
  }

  useEffect(() => {
    loadEvents()
    loadTeams()
  }, [])

  const resetForm = () => {
    setTitle('')
    setType('match')
    setDate('')
    setStartTime('')
    setEndTime('')
    setLocation('')
    setDescription('')
    setTeamId('')
    setEditing(null)
    setCreating(false)
  }

  const startEdit = (ev: CalendarEvent) => {
    setTitle(ev.title)
    setType(ev.type)
    setDate(ev.date ? ev.date.split('T')[0] : '')
    setStartTime(ev.startTime || '')
    setEndTime(ev.endTime || '')
    setLocation(ev.location || '')
    setDescription(ev.description || '')
    setTeamId(ev.teamId || '')
    setEditing(ev)
    setCreating(false)
  }

  const handleSave = async () => {
    if (!title || !date) {
      showToast('Completeaza titlul si data', 'err')
      return
    }

    const body = {
      title,
      type,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      location: location || null,
      description: description || null,
      teamId: teamId || null,
    }

    const url = editing
      ? `/api/admin/calendar/${editing.id}`
      : '/api/admin/calendar'

    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCsrfToken(),
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      showToast(editing ? 'Eveniment actualizat' : 'Eveniment creat')
      resetForm()
      loadEvents()
    } else {
      showToast('Eroare la salvare', 'err')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sterge evenimentul? Aceasta actiune este ireversibila.')) return

    const res = await fetch(`/api/admin/calendar/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': getCsrfToken() },
    })

    if (res.ok) {
      showToast('Eveniment sters')
      loadEvents()
    } else {
      showToast('Eroare la stergere', 'err')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">Calendar Evenimente</h1>

      {(creating || editing) ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="font-heading font-bold text-lg mb-4">
            {editing ? 'Editeaza eveniment' : 'Eveniment nou'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titlu</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Titlul evenimentului" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tip eveniment</label>
                <select value={type} onChange={e => setType(e.target.value as 'match' | 'training' | 'event')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {EVENT_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ora inceput</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ora sfarsit</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Locatia evenimentului" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Echipa</label>
                <select value={teamId} onChange={e => setTeamId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">-- Fara echipa --</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={4} placeholder="Descrierea evenimentului" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave}
                className="px-6 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                {editing ? 'Salveaza' : 'Creaza eveniment'}
              </button>
              <button onClick={resetForm}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Anuleaza
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <button onClick={() => setCreating(true)}
            className="mb-4 px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm">
            + Eveniment nou
          </button>

          {events.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-gray-500">Niciun eveniment in calendar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(ev => (
                <div key={ev.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-heading font-bold">{ev.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[ev.type] || 'bg-gray-100 text-gray-600'}`}>
                          {TYPE_LABEL[ev.type] || ev.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(ev.date).toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        {ev.startTime && ` \u00B7 ${ev.startTime}`}
                        {ev.endTime && ` - ${ev.endTime}`}
                        {ev.location && ` \u00B7 ${ev.location}`}
                      </p>
                      {ev.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ev.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(ev)}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">Editeaza</button>
                      <button onClick={() => handleDelete(ev.id)}
                        className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded">Sterge</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium z-50 ${
          toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
