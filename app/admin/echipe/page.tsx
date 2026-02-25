'use client'

import { useEffect, useState } from 'react'
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

const grupe = ['U10', 'U12', 'U14', 'U16', 'U18']

export default function AdminTeams() {
  const [activeTab, setActiveTab] = useState('U10')
  const [teams, setTeams] = useState<Team[]>([])
  const [teamForm, setTeamForm] = useState({ coachName: '', coachPhoto: '', coachBio: '', schedule: '', description: '' })
  const [saving, setSaving] = useState(false)

  const loadTeams = () => fetch('/api/teams').then(r => r.json()).then(setTeams)

  useEffect(() => { loadTeams() }, [])
  useEffect(() => {
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
  }, [activeTab, teams])

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

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Gestionare Echipe</h1>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Program antrenamente</label>
            <textarea rows={3} value={teamForm.schedule}
              onChange={e => setTeamForm({ ...teamForm, schedule: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none"
              placeholder="Luni: 16:00-18:00 — Stadion Dinamo&#10;Miercuri: 16:00-18:00 — Stadion Dinamo&#10;Vineri: 16:00-18:00 — Stadion Dinamo" />
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
