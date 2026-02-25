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
}

interface ParentData {
  id: string
  name: string
  email: string
  phone: string | null
  children: ChildData[]
}

export default function DashboardPage() {
  const [parent, setParent] = useState<ParentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPhone, setEditingPhone] = useState(false)
  const [phone, setPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const router = useRouter()

  const fetchData = () => {
    fetch('/api/parinti/me')
      .then(r => {
        if (r.status === 401) { router.push('/parinti'); return null }
        return r.json()
      })
      .then(data => {
        if (data && !data.error) {
          setParent(data)
          setPhone(data.phone || '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSavePhone = async () => {
    setSavingPhone(true)
    const res = await fetch('/api/parinti/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    if (res.ok) {
      fetchData()
      setEditingPhone(false)
    }
    setSavingPhone(false)
  }

  const handleRetractConsent = async (childId: string, childName: string) => {
    if (!confirm(`Retrage acordul foto pentru ${childName}? Vei putea semna din nou oricand.`)) return
    const res = await fetch(`/api/parinti/acord-foto/${childId}`, { method: 'DELETE' })
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
        <h2 className="font-heading font-bold text-lg mb-4">Copiii mei</h2>
        {parent.children.length === 0 ? (
          <p className="text-gray-500 text-sm">Nu ai copii inregistrati. Contacteaza antrenorul pentru adaugare.</p>
        ) : (
          <div className="space-y-3">
            {parent.children.map(child => (
              <div key={child.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <span className="font-medium">{child.name}</span>
                  <span className="text-gray-500 text-sm ml-2">({child.birthYear})</span>
                  {child.teamName && (
                    <span className="ml-2 text-xs bg-dinamo-blue text-white px-2 py-0.5 rounded-full">{child.teamName}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Consent Card */}
      <div className="bg-white rounded-lg shadow-sm border p-5">
        <h2 className="font-heading font-bold text-lg mb-4">Acorduri foto</h2>
        {parent.children.length === 0 ? (
          <p className="text-gray-500 text-sm">Nu ai copii inregistrati.</p>
        ) : (
          <div className="space-y-3">
            {parent.children.map(child => (
              <div key={child.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{child.name}</span>
                  {child.photoConsentDate ? (
                    <span className="text-green-600 text-sm font-medium">
                      Semnat pe {new Date(child.photoConsentDate).toLocaleDateString('ro-RO')}
                    </span>
                  ) : (
                    <span className="text-amber-600 text-sm font-medium">Nesemnat</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {child.photoConsentDate ? (
                    <>
                      <Link
                        href={`/parinti/acord-foto/${child.id}`}
                        className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
                      >
                        Vezi acord
                      </Link>
                      <button
                        onClick={() => handleRetractConsent(child.id, child.name)}
                        className="text-sm text-red-500 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
                      >
                        Retrage acord
                      </button>
                    </>
                  ) : (
                    <Link
                      href={`/parinti/acord-foto/${child.id}`}
                      className="text-sm bg-dinamo-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Semneaza acum &rarr;
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phone / Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border p-5">
        <h2 className="font-heading font-bold text-lg mb-4">Datele mele</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Nume:</span>
            <span className="font-medium">{parent.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email:</span>
            <span className="font-medium">{parent.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Telefon:</span>
            {editingPhone ? (
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm w-36"
                  placeholder="07xx xxx xxx"
                />
                <button onClick={handleSavePhone} disabled={savingPhone}
                  className="text-xs bg-dinamo-blue text-white px-2 py-1 rounded">
                  {savingPhone ? '...' : 'Salveaza'}
                </button>
                <button onClick={() => { setEditingPhone(false); setPhone(parent.phone || '') }}
                  className="text-xs text-gray-500 px-2 py-1">Anuleaza</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium">{parent.phone || '—'}</span>
                <button onClick={() => setEditingPhone(true)} className="text-xs text-dinamo-blue hover:underline">
                  Modifica
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documents Card */}
      <div className="bg-white rounded-lg shadow-sm border p-5">
        <h2 className="font-heading font-bold text-lg mb-4">Documente</h2>
        <p className="text-gray-500 text-sm">Documentele vor fi disponibile in curand.</p>
      </div>
    </div>
  )
}
