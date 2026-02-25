'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ChildData {
  id: string
  name: string
  birthYear: number
  teamId: number | null
  teamName: string | null
  photoConsent: boolean
  photoConsentWA: boolean
  photoConsentDate: string | null
  signatureData: boolean
  medicalCert: boolean
}

interface ParentData {
  id: string
  name: string
  email: string
  phone: string | null
  whatsappConsent: boolean
  children: ChildData[]
}

export default function DashboardPage() {
  const [parent, setParent] = useState<ParentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddChild, setShowAddChild] = useState(false)
  const [newChild, setNewChild] = useState({ name: '', birthYear: '', teamId: '' })
  const [teams, setTeams] = useState<{ id: number; grupa: string }[]>([])
  const [adding, setAdding] = useState(false)
  const router = useRouter()

  const fetchData = () => {
    fetch('/api/parinti/me')
      .then(r => {
        if (r.status === 401) { router.push('/parinti'); return null }
        return r.json()
      })
      .then(data => {
        if (data && !data.error) setParent(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    fetch('/api/teams?active=1')
      .then(r => r.ok ? r.json() : [])
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    const res = await fetch('/api/parinti/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newChild.name,
        birthYear: Number(newChild.birthYear),
        teamId: newChild.teamId ? Number(newChild.teamId) : null,
      }),
    })
    if (res.ok) {
      setNewChild({ name: '', birthYear: '', teamId: '' })
      setShowAddChild(false)
      fetchData()
    }
    setAdding(false)
  }

  const handleDeleteChild = async (childId: string, childName: string) => {
    if (!confirm(`Stergi copilul ${childName}?`)) return
    const res = await fetch(`/api/parinti/children/${childId}`, { method: 'DELETE' })
    if (res.ok) fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!parent) return null

  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-dinamo-blue">
          Bine ai venit, {parent.name}!
        </h1>
        <p className="text-gray-600 text-sm">{parent.email}</p>
      </div>

      {/* Children Card */}
      <div className="bg-white rounded-lg shadow-sm border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg">Copiii mei</h2>
          <button
            onClick={() => setShowAddChild(!showAddChild)}
            className="text-sm bg-dinamo-blue text-white px-3 py-1.5 rounded hover:bg-blue-800 transition-colors"
          >
            + Adauga copil
          </button>
        </div>

        {showAddChild && (
          <form onSubmit={handleAddChild} className="border rounded-lg p-4 mb-4 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <input
                type="text"
                value={newChild.name}
                onChange={e => setNewChild({ ...newChild, name: e.target.value })}
                placeholder="Nume copil"
                required
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none"
              />
              <select
                value={newChild.birthYear}
                onChange={e => setNewChild({ ...newChild, birthYear: e.target.value })}
                required
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none"
              >
                <option value="">An nastere</option>
                {Array.from({ length: 18 }, (_, i) => currentYear - 5 - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={newChild.teamId}
                onChange={e => setNewChild({ ...newChild, teamId: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none"
              >
                <option value="">Echipa</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.grupa}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adding}
                className="text-sm bg-dinamo-red text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {adding ? 'Se adauga...' : 'Adauga'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddChild(false)}
                className="text-sm text-gray-500 px-4 py-2 hover:text-gray-700"
              >
                Anuleaza
              </button>
            </div>
          </form>
        )}

        {parent.children.length === 0 ? (
          <p className="text-gray-500 text-sm">Nu ai adaugat niciun copil inca.</p>
        ) : (
          <div className="space-y-3">
            {parent.children.map(child => (
              <div key={child.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <span className="font-medium">{child.name}</span>
                  <span className="text-gray-500 text-sm ml-2">({child.birthYear})</span>
                  {child.teamName && (
                    <span className="text-sm text-dinamo-blue ml-2">{child.teamName}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteChild(child.id, child.name)}
                  className="text-gray-400 hover:text-red-500 text-sm"
                >
                  Sterge
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Consent Card */}
      <div className="bg-white rounded-lg shadow-sm border p-5">
        <h2 className="font-heading font-bold text-lg mb-4">Acorduri foto</h2>
        {parent.children.length === 0 ? (
          <p className="text-gray-500 text-sm">Adauga un copil pentru a semna acordurile foto.</p>
        ) : (
          <div className="space-y-3">
            {parent.children.map(child => (
              <div key={child.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{child.name}</span>
                  {child.photoConsentDate ? (
                    <span className="text-green-600 text-sm font-medium">
                      Semnat {new Date(child.photoConsentDate).toLocaleDateString('ro-RO')}
                    </span>
                  ) : (
                    <span className="text-amber-600 text-sm font-medium">Nesemnat</span>
                  )}
                </div>
                <Link
                  href={`/parinti/acord-foto/${child.id}`}
                  className={`text-sm px-3 py-1.5 rounded transition-colors ${
                    child.photoConsentDate
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-dinamo-red text-white hover:bg-red-700'
                  }`}
                >
                  {child.photoConsentDate ? 'Revizuieste' : 'Semneaza acum'}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents Card */}
      <div className="bg-white rounded-lg shadow-sm border p-5">
        <h2 className="font-heading font-bold text-lg mb-4">Documente</h2>
        <p className="text-gray-500 text-sm">Documentele vor fi disponibile in curand.</p>
      </div>
    </div>
  )
}
