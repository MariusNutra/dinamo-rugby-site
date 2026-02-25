'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface TeamOption {
  id: number
  grupa: string
}

export default function SolicitaAccesPage() {
  const [form, setForm] = useState({
    parentName: '',
    email: '',
    phone: '',
    childName: '',
    childBirthYear: '',
    teamId: '',
    message: '',
  })
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/teams?active=1')
      .then(r => r.ok ? r.json() : [])
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/api/parinti/solicita-acces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName: form.parentName,
          email: form.email,
          phone: form.phone,
          childName: form.childName,
          childBirthYear: Number(form.childBirthYear),
          teamId: form.teamId ? Number(form.teamId) : null,
          message: form.message || null,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Eroare la trimitere.')
        setStatus('error')
        return
      }

      setStatus('sent')
    } catch {
      setStatus('error')
      setErrorMsg('Eroare de conexiune. Incearca din nou.')
    }
  }

  const update = (field: string, value: string) => setForm({ ...form, [field]: value })
  const currentYear = new Date().getFullYear()

  if (status === 'sent') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8">
            <div className="text-5xl mb-4">&#10003;</div>
            <h2 className="font-heading text-xl font-bold text-green-800 mb-2">
              Cererea ta a fost trimisa!
            </h2>
            <p className="text-green-700">
              Vei primi un email cand antrenorul aproba accesul.
            </p>
            <Link href="/parinti" className="inline-block mt-6 text-sm text-green-600 hover:underline">
              &larr; Inapoi la pagina de conectare
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[50vh] flex items-start justify-center pt-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Image
            src="/images/dinamo-rugby-bulldog.png"
            alt="Dinamo Rugby"
            width={60}
            height={60}
            className="w-15 h-15 mx-auto mb-3 object-contain"
          />
          <h1 className="font-heading text-2xl font-bold text-dinamo-blue mb-1">Solicita acces la Portal</h1>
          <p className="text-gray-600 text-sm">Completeaza formularul si vei primi acces dupa aprobarea antrenorului</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume parinte *</label>
            <input
              type="text"
              value={form.parentName}
              onChange={e => update('parentName', e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon WhatsApp *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              placeholder="07xx xxx xxx"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume copil *</label>
            <input
              type="text"
              value={form.childName}
              onChange={e => update('childName', e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">An nastere copil *</label>
              <select
                value={form.childBirthYear}
                onChange={e => update('childBirthYear', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none text-base"
              >
                <option value="">Selecteaza</option>
                {Array.from({ length: 18 }, (_, i) => currentYear - 5 - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Echipa dorita</label>
              <select
                value={form.teamId}
                onChange={e => update('teamId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none text-base"
              >
                <option value="">Selecteaza</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.grupa}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj (optional)</label>
            <textarea
              value={form.message}
              onChange={e => update('message', e.target.value)}
              placeholder="Ex: Am vorbit cu antrenorul Guranescu"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none text-base resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full bg-dinamo-red text-white py-3 px-6 rounded-lg font-heading font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {status === 'sending' ? 'Se trimite...' : 'Trimite cererea'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/parinti" className="text-sm text-gray-500 hover:underline">
            &larr; Inapoi la conectare
          </Link>
        </div>
      </div>
    </div>
  )
}
