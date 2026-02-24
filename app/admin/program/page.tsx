'use client'

import { useEffect, useState } from 'react'

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
const zile = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică']

export default function AdminProgram() {
  const [activeTab, setActiveTab] = useState('U10')
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [form, setForm] = useState({ day: 'Luni', startTime: '16:00', endTime: '18:00', location: '', coachName: '' })
  const [saving, setSaving] = useState(false)

  const loadSessions = () => fetch(`/api/training?grupa=${activeTab}`).then(r => r.json()).then(setSessions)

  useEffect(() => { loadSessions() }, [activeTab])

  const addSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/training', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grupa: activeTab,
        day: form.day,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location,
        coachName: form.coachName || null,
      }),
    })
    setForm({ day: 'Luni', startTime: '16:00', endTime: '18:00', location: '', coachName: '' })
    setSaving(false)
    loadSessions()
  }

  const deleteSession = async (id: number) => {
    if (!confirm('Ștergi această sesiune de antrenament?')) return
    await fetch(`/api/training/${id}`, { method: 'DELETE' })
    loadSessions()
  }

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Program Antrenamente</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {grupe.map(g => (
          <button key={g} onClick={() => setActiveTab(g)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
              activeTab === g ? 'bg-dinamo-red text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {g}
          </button>
        ))}
      </div>

      {/* Add session form */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="font-heading font-bold text-lg mb-4">Adaugă sesiune antrenament — {activeTab}</h2>
        <form onSubmit={addSession} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ziua</label>
              <select value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none">
                {zile.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ora start</label>
              <input type="time" required value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ora final</label>
              <input type="time" required value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Locația</label>
              <input type="text" required placeholder="Stadionul Dinamo" value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Antrenor (opțional)</label>
              <input type="text" placeholder="Nume antrenor" value={form.coachName}
                onChange={e => setForm({ ...form, coachName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-dinamo-red text-white px-6 py-2 rounded-lg font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50">
            {saving ? 'Se salvează...' : '+ Adaugă sesiune'}
          </button>
        </form>
      </div>

      {/* Session list */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="font-heading font-bold text-lg mb-4">Sesiuni de antrenament — {activeTab}</h2>
        <div className="space-y-2">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-6">
                <span className="font-bold text-gray-900 min-w-[90px]">{s.day}</span>
                <span className="text-gray-700">{s.startTime} - {s.endTime}</span>
                <span className="text-gray-600">{s.location}</span>
                {s.coachName && <span className="text-sm text-gray-500">({s.coachName})</span>}
              </div>
              <button onClick={() => deleteSession(s.id)}
                className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-sm">
                Șterge
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-gray-400 text-center py-4">Nu sunt sesiuni de antrenament pentru {activeTab}.</p>
          )}
        </div>
      </div>
    </div>
  )
}
