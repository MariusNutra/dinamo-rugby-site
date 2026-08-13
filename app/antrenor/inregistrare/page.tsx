'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PasswordInput from '@/components/PasswordInput'

interface TeamOption {
  id: number
  grupa: string
}

export default function InregistrareAntrenorPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    teamId: '',
  })
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')
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
      const res = await fetch('/api/antrenor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          password: form.password,
          teamId: form.teamId ? Number(form.teamId) : null,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Eroare la inregistrare.')
        setStatus('error')
        return
      }

      router.push(data.redirect || '/antrenor/dashboard')
    } catch {
      setStatus('error')
      setErrorMsg('Eroare de conexiune. Incearca din nou.')
    }
  }

  const update = (field: string, value: string) => setForm({ ...form, [field]: value })

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
          <h1 className="font-heading text-2xl font-bold text-dinamo-blue mb-1">Inregistrare Antrenor</h1>
          <p className="text-gray-600 text-sm">Creeaza-ti contul pentru a accesa portalul antrenorilor</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume complet *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              placeholder="07xx xxx xxx"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parola *</label>
            <PasswordInput
              value={form.password}
              onChange={(v) => update('password', v)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none text-base"
              autoComplete="new-password"
              placeholder="Minim 6 caractere"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Echipa (optional)</label>
            <select
              value={form.teamId}
              onChange={e => update('teamId', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none text-base"
            >
              <option value="">Selecteaza echipa</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.grupa}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full bg-dinamo-red text-white py-3 px-6 rounded-lg font-heading font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {status === 'sending' ? 'Se creeaza contul...' : 'Creeaza cont'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/antrenor/login" className="text-sm text-gray-500 hover:underline">
            Ai deja cont? Conecteaza-te &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
