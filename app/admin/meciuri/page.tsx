'use client'

import { useEffect, useState } from 'react'

interface Match {
  id: number
  grupa: string
  date: string
  opponent: string
  location: string | null
  scoreHome: number | null
  scoreAway: number | null
  description: string | null
}

const grupe = ['U10', 'U12', 'U14', 'U16', 'U18']

export default function AdminMeciuri() {
  const [activeTab, setActiveTab] = useState('U10')
  const [matches, setMatches] = useState<Match[]>([])
  const [form, setForm] = useState({
    date: '', opponent: '', location: '', scoreHome: '', scoreAway: '', description: '',
  })
  const [saving, setSaving] = useState(false)

  const loadMatches = () => fetch(`/api/matches?grupa=${activeTab}`).then(r => r.json()).then(setMatches)

  useEffect(() => { loadMatches() }, [activeTab])

  const addMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grupa: activeTab,
        date: form.date,
        opponent: form.opponent,
        location: form.location || null,
        scoreHome: form.scoreHome || null,
        scoreAway: form.scoreAway || null,
        description: form.description || null,
      }),
    })
    setForm({ date: '', opponent: '', location: '', scoreHome: '', scoreAway: '', description: '' })
    setSaving(false)
    loadMatches()
  }

  const deleteMatch = async (id: number) => {
    if (!confirm('Ștergi acest meci?')) return
    await fetch(`/api/matches/${id}`, { method: 'DELETE' })
    loadMatches()
  }

  const now = new Date()
  const upcoming = matches.filter(m => new Date(m.date) >= now).reverse()
  const past = matches.filter(m => new Date(m.date) < now)

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Calendar Meciuri</h1>

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

      {/* Add match form */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="font-heading font-bold text-lg mb-4">Adaugă meci — {activeTab}</h2>
        <form onSubmit={addMatch} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data și ora</label>
              <input type="datetime-local" required value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adversar</label>
              <input type="text" required placeholder="Numele echipei" value={form.opponent}
                onChange={e => setForm({ ...form, opponent: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Locația</label>
              <input type="text" placeholder="Stadionul Dinamo" value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scor Dinamo</label>
              <input type="number" placeholder="—" value={form.scoreHome}
                onChange={e => setForm({ ...form, scoreHome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scor adversar</label>
              <input type="number" placeholder="—" value={form.scoreAway}
                onChange={e => setForm({ ...form, scoreAway: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descriere (opțional)</label>
              <input type="text" placeholder="Competiție, detalii..." value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-dinamo-red text-white px-6 py-2 rounded-lg font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50">
            {saving ? 'Se salvează...' : '+ Adaugă meci'}
          </button>
        </form>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Meciuri viitoare — {activeTab}
          </h2>
          <div className="space-y-2">
            {upcoming.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm text-gray-500 min-w-[130px]">
                    {new Date(m.date).toLocaleDateString('ro-RO')} {new Date(m.date).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="font-medium">Dinamo vs {m.opponent}</span>
                  {m.location && <span className="text-sm text-gray-500">@ {m.location}</span>}
                </div>
                <button onClick={() => deleteMatch(m.id)}
                  className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-sm">
                  Șterge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
          Rezultate — {activeTab}
        </h2>
        <div className="space-y-2">
          {past.map(m => (
            <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm text-gray-500 min-w-[130px]">
                  {new Date(m.date).toLocaleDateString('ro-RO')}
                </span>
                <span className="font-medium">Dinamo vs {m.opponent}</span>
                {m.location && <span className="text-sm text-gray-500">@ {m.location}</span>}
                {m.scoreHome !== null && m.scoreAway !== null && (
                  <span className={`font-bold ${
                    m.scoreHome > m.scoreAway ? 'text-green-600' :
                    m.scoreHome < m.scoreAway ? 'text-red-600' : 'text-gray-600'
                  }`}>{m.scoreHome} - {m.scoreAway}</span>
                )}
              </div>
              <button onClick={() => deleteMatch(m.id)}
                className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-sm">
                Șterge
              </button>
            </div>
          ))}
          {past.length === 0 && upcoming.length === 0 && (
            <p className="text-gray-400 text-center py-4">Nu sunt meciuri pentru {activeTab}.</p>
          )}
        </div>
      </div>
    </div>
  )
}
