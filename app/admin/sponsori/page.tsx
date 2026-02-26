'use client'

import { useState, useEffect } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

interface Sponsor {
  id: string
  name: string
  logo: string | null
  website: string | null
  description: string
  tier: string
  sortOrder: number
  active: boolean
  createdAt: string
}

const TIERS = ['gold', 'silver', 'bronze']

const TIER_LABELS: Record<string, string> = {
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
}

const TIER_BADGE: Record<string, string> = {
  gold: 'bg-yellow-100 text-yellow-700',
  silver: 'bg-gray-200 text-gray-700',
  bronze: 'bg-orange-100 text-orange-700',
}

export default function AdminSponsoriPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Sponsor | null>(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [logo, setLogo] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')
  const [tier, setTier] = useState(TIERS[0])
  const [sortOrder, setSortOrder] = useState(0)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadSponsors = () => {
    fetch('/api/admin/sponsori')
      .then(r => r.json())
      .then(data => {
        setSponsors(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadSponsors() }, [])

  const resetForm = () => {
    setName('')
    setLogo('')
    setWebsite('')
    setDescription('')
    setTier(TIERS[0])
    setSortOrder(0)
    setEditing(null)
    setCreating(false)
  }

  const startEdit = (s: Sponsor) => {
    setName(s.name)
    setLogo(s.logo || '')
    setWebsite(s.website || '')
    setDescription(s.description)
    setTier(s.tier)
    setSortOrder(s.sortOrder)
    setEditing(s)
    setCreating(false)
  }

  const handleSave = async () => {
    if (!name || !description) {
      showToast('Completeaza numele si descrierea', 'err')
      return
    }

    const body = {
      name,
      logo: logo || null,
      website: website || null,
      description,
      tier,
      sortOrder,
    }

    const url = editing
      ? `/api/admin/sponsori/${editing.id}`
      : '/api/admin/sponsori'

    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCsrfToken(),
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      showToast(editing ? 'Sponsor actualizat' : 'Sponsor creat')
      resetForm()
      loadSponsors()
    } else {
      showToast('Eroare la salvare', 'err')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sterge sponsorul? Aceasta actiune este ireversibila.')) return

    const res = await fetch(`/api/admin/sponsori/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': getCsrfToken() },
    })

    if (res.ok) {
      showToast('Sponsor sters')
      loadSponsors()
    } else {
      showToast('Eroare la stergere', 'err')
    }
  }

  const toggleActive = async (s: Sponsor) => {
    const res = await fetch(`/api/admin/sponsori/${s.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCsrfToken(),
      },
      body: JSON.stringify({ active: !s.active }),
    })
    if (res.ok) {
      showToast(s.active ? 'Sponsor dezactivat' : 'Sponsor activat')
      loadSponsors()
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
      <h1 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">Sponsori</h1>

      {(creating || editing) ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="font-heading font-bold text-lg mb-4">
            {editing ? 'Editeaza sponsor' : 'Sponsor nou'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nume</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Numele sponsorului" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={4} placeholder="Descrierea sponsorului" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Logo (optional)</label>
              <input type="text" value={logo} onChange={e => setLogo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
              <input type="text" value={website} onChange={e => setWebsite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
                <select value={tier} onChange={e => setTier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {TIERS.map(t => (
                    <option key={t} value={t}>{TIER_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordine afisare</label>
                <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" min={0} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave}
                className="px-6 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                {editing ? 'Salveaza' : 'Creaza sponsor'}
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
            + Sponsor nou
          </button>

          {sponsors.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <p className="text-gray-500">Niciun sponsor adaugat</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sponsors.map(s => (
                <div key={s.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {s.logo && (
                        <img src={s.logo} alt={s.name} className="w-12 h-12 rounded object-contain bg-gray-50 p-1" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-bold">{s.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_BADGE[s.tier] || 'bg-gray-100 text-gray-600'}`}>
                            {TIER_LABELS[s.tier] || s.tier}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{s.description}</p>
                        {s.website && (
                          <a href={s.website} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-dinamo-blue hover:underline mt-0.5 inline-block">{s.website}</a>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">Ordine: {s.sortOrder}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleActive(s)}
                        className={`px-2 py-1 text-xs rounded ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {s.active ? 'Activ' : 'Inactiv'}
                      </button>
                      <button onClick={() => startEdit(s)}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">Editeaza</button>
                      <button onClick={() => handleDelete(s.id)}
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
