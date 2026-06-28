'use client'

import { useState, useEffect } from 'react'

interface Team {
  id: number
  grupa: string
  active: boolean
}

export default function InscrieriPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [childFirstName, setChildFirstName] = useState('')
  const [childLastName, setChildLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [teamId, setTeamId] = useState('')
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [hasExperience, setHasExperience] = useState(false)
  const [experience, setExperience] = useState('')
  const [gdprConsent, setGdprConsent] = useState(false)

  useEffect(() => {
    fetch('/api/teams?active=1')
      .then(r => r.json())
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/inscrieri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childFirstName,
          childLastName,
          birthDate,
          teamId: teamId ? Number(teamId) : null,
          parentName,
          phone,
          email,
          experience: hasExperience ? experience : null,
          gdprConsent,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Eroare la trimiterea formularului')
      }
    } catch {
      setError('Eroare de conexiune. Reincercati.')
    }
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="font-heading text-3xl font-bold text-dinamo-blue mb-3">Inscriere trimisa!</h1>
        <p className="text-gray-600 mb-6">
          Multumim pentru interesul aratat. Am primit cererea de inscriere si veti primi un email de confirmare.
          Vom reveni cu un raspuns in cel mai scurt timp.
        </p>
        <a href="/" className="inline-block px-6 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
          Inapoi la pagina principala
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-dinamo-blue mb-3">
          Inscrieri Dinamo Rugby Juniori
        </h1>
        <p className="text-gray-600">
          Completeaza formularul de mai jos pentru a inscrie copilul la antrenamentele de rugby.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 md:p-8 space-y-6">
        <h2 className="font-heading font-bold text-lg text-dinamo-blue border-b pb-2">Date copil</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
            <input type="text" required value={childLastName} onChange={e => setChildLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red/50 focus:border-dinamo-red" placeholder="Popescu" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prenume *</label>
            <input type="text" required value={childFirstName} onChange={e => setChildFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red/50 focus:border-dinamo-red" placeholder="Andrei" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data nasterii *</label>
            <input type="date" required value={birthDate} onChange={e => setBirthDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red/50 focus:border-dinamo-red" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grupa dorita</label>
            <select value={teamId} onChange={e => setTeamId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red/50 focus:border-dinamo-red">
              <option value="">-- Selecteaza --</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.grupa}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasExperience} onChange={e => setHasExperience(e.target.checked)} className="rounded" />
            Copilul are experienta anterioara in sport
          </label>
          {hasExperience && (
            <textarea value={experience} onChange={e => setExperience(e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red/50 focus:border-dinamo-red"
              rows={2} placeholder="Descrieti pe scurt experienta (sport, club, perioada...)" />
          )}
        </div>

        <h2 className="font-heading font-bold text-lg text-dinamo-blue border-b pb-2 pt-2">Date parinte/tutore</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nume complet parinte *</label>
          <input type="text" required value={parentName} onChange={e => setParentName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red/50 focus:border-dinamo-red" placeholder="Popescu Ion" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
            <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red/50 focus:border-dinamo-red" placeholder="07xx xxx xxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red/50 focus:border-dinamo-red" placeholder="email@exemplu.ro" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required checked={gdprConsent} onChange={e => setGdprConsent(e.target.checked)}
              className="rounded mt-0.5" />
            <span>
              Sunt de acord cu prelucrarea datelor personale conform{' '}
              <a href="/politica-confidentialitate" target="_blank" className="text-dinamo-red hover:underline">
                Politicii de Confidentialitate
              </a>
              . Datele vor fi folosite exclusiv in scopul procesului de inscriere. *
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full py-3 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-bold text-lg disabled:opacity-50">
          {submitting ? 'Se trimite...' : 'Trimite inscrierea'}
        </button>
      </form>
    </div>
  )
}
