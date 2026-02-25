'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface TeamOption {
  id: number
  grupa: string
}

interface ChildForm {
  name: string
  birthYear: string
  teamId: string
}

export default function InregistrarePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsappConsent, setWhatsappConsent] = useState(false)
  const [children, setChildren] = useState<ChildForm[]>([{ name: '', birthYear: '', teamId: '' }])
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/teams?active=1')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setTeams(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
  }, [])

  const addChild = () => {
    setChildren([...children, { name: '', birthYear: '', teamId: '' }])
  }

  const removeChild = (idx: number) => {
    if (children.length <= 1) return
    setChildren(children.filter((_, i) => i !== idx))
  }

  const updateChild = (idx: number, field: keyof ChildForm, value: string) => {
    const updated = [...children]
    updated[idx] = { ...updated[idx], [field]: value }
    setChildren(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // Register parent
      const regRes = await fetch('/api/parinti/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, whatsappConsent }),
      })
      if (!regRes.ok) {
        const data = await regRes.json()
        setError(data.error || 'Eroare la inregistrare.')
        setSubmitting(false)
        return
      }

      // Add children
      const validChildren = children.filter(c => c.name.trim() && c.birthYear)
      for (const child of validChildren) {
        const childRes = await fetch('/api/parinti/children', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: child.name,
            birthYear: Number(child.birthYear),
            teamId: child.teamId ? Number(child.teamId) : null,
          }),
        })
        if (!childRes.ok) {
          const data = await childRes.json()
          setError(data.error || `Eroare la adaugarea copilului ${child.name}.`)
          setSubmitting(false)
          return
        }
      }

      router.push('/parinti/dashboard')
    } catch {
      setError('Eroare de conexiune.')
      setSubmitting(false)
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">Inregistrare</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Parent info */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h2 className="font-heading font-bold text-lg mb-4">Date parinte</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nume complet *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon (WhatsApp)</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="07xx xxx xxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none"
              />
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappConsent}
                onChange={e => setWhatsappConsent(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-gray-600">
                Sunt de acord sa fiu contactat/a prin WhatsApp pentru comunicari legate de activitatea copilului
              </span>
            </label>
          </div>
        </div>

        {/* Children */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h2 className="font-heading font-bold text-lg mb-4">Copii</h2>
          <div className="space-y-4">
            {children.map((child, idx) => (
              <div key={idx} className="border rounded-lg p-4 relative">
                {children.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeChild(idx)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-lg"
                    title="Sterge"
                  >
                    &times;
                  </button>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nume copil *
                    </label>
                    <input
                      type="text"
                      value={child.name}
                      onChange={e => updateChild(idx, 'name', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">An nastere *</label>
                      <select
                        value={child.birthYear}
                        onChange={e => updateChild(idx, 'birthYear', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none"
                      >
                        <option value="">Selecteaza</option>
                        {Array.from({ length: 18 }, (_, i) => currentYear - 5 - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Echipa</label>
                      <select
                        value={child.teamId}
                        onChange={e => updateChild(idx, 'teamId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none"
                      >
                        <option value="">Selecteaza</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>{team.grupa}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addChild}
            className="mt-3 text-sm text-dinamo-blue hover:underline font-medium"
          >
            + Adauga alt copil
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-dinamo-red text-white py-3 px-6 rounded-lg font-heading font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Se salveaza...' : 'Continua'}
        </button>
      </form>
    </div>
  )
}
