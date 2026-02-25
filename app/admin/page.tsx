'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface AccessRequest {
  id: string
  parentName: string
  email: string
  phone: string | null
  childName: string
  childBirthYear: number
  teamName: string | null
  message: string | null
  createdAt: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ stories: 0, photos: 0, teams: 0, matches: 0 })
  const [parentStats, setParentStats] = useState({ parents: 0, acorduriSigned: 0, acorduriTotal: 0 })
  const [sportivStats, setSportivStats] = useState({ evaluariLuna: 0, prezenteAzi: 0, medicalActiv: 0 })
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchPending = () => {
    fetch('/api/admin/cereri-acces?status=pending')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.requests) setPendingRequests(data.requests)
      })
      .catch(() => {})
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/stories').then(r => r.json()),
      fetch('/api/photos').then(r => r.json()),
      fetch('/api/teams').then(r => r.json()),
      fetch('/api/matches').then(r => r.json()),
    ]).then(([stories, photos, teams, matches]) => {
      setStats({
        stories: stories.length,
        photos: photos.length,
        teams: teams.length,
        matches: matches.length,
      })
    })

    fetch('/api/admin/parinti').then(r => r.ok ? r.json() : []).then(data => {
      if (Array.isArray(data)) setParentStats(prev => ({ ...prev, parents: data.length }))
    }).catch(() => {})

    fetch('/api/admin/acorduri').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.stats) setParentStats(prev => ({ ...prev, acorduriSigned: data.stats.signed, acorduriTotal: data.stats.total }))
    }).catch(() => {})

    fetch('/api/admin/sportivi/stats').then(r => r.ok ? r.json() : null).then(data => {
      if (data) setSportivStats(data)
    }).catch(() => {})

    fetchPending()
  }, [])

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    const res = await fetch(`/api/admin/cereri-acces/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
    if (res.ok) fetchPending()
    setProcessingId(null)
  }

  const handleReject = async (id: string) => {
    if (!confirm('Respinge aceasta cerere?')) return
    setProcessingId(id)
    const res = await fetch(`/api/admin/cereri-acces/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    })
    if (res.ok) fetchPending()
    setProcessingId(null)
  }

  const acorduriPercent = parentStats.acorduriTotal > 0 ? Math.round((parentStats.acorduriSigned / parentStats.acorduriTotal) * 100) : 0

  const cards = [
    { label: 'Povești', count: stats.stories, href: '/admin/povesti', icon: '📝', color: 'bg-blue-500' },
    { label: 'Poze', count: stats.photos, href: '/admin/galerie', icon: '📸', color: 'bg-green-500' },
    { label: 'Echipe', count: stats.teams, href: '/admin/echipe', icon: '🏉', color: 'bg-dinamo-red' },
    { label: 'Meciuri', count: stats.matches, href: '/admin/meciuri', icon: '🏆', color: 'bg-purple-500' },
    { label: 'Parinti', count: parentStats.parents, href: '/admin/parinti', icon: '👨‍👩‍👧', color: 'bg-indigo-500' },
    { label: 'Acorduri', count: `${acorduriPercent}%`, href: '/admin/acorduri', icon: '📋', color: 'bg-amber-500' },
    { label: 'Evaluari', count: sportivStats.evaluariLuna, href: '/admin/evaluari', icon: '📊', color: 'bg-teal-500' },
    { label: 'Prezente', count: sportivStats.prezenteAzi, href: '/admin/prezente', icon: '✅', color: 'bg-emerald-500' },
    { label: 'Medical', count: sportivStats.medicalActiv, href: '/admin/sportivi', icon: '🏥', color: 'bg-rose-500' },
  ]

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map(c => (
          <Link key={c.label} href={c.href} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{c.icon}</span>
              <span className={`${c.color} text-white text-xs px-2 py-1 rounded-full font-bold`}>{c.count}</span>
            </div>
            <h3 className="font-heading font-bold text-gray-900">{c.label}</h3>
          </Link>
        ))}
      </div>

      {/* Cereri in asteptare */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">
              Cereri acces in asteptare
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
            </h2>
            <Link href="/admin/cereri-acces" className="text-sm text-dinamo-blue hover:underline">
              Vezi toate →
            </Link>
          </div>
          <div className="space-y-3">
            {pendingRequests.slice(0, 5).map(req => (
              <div key={req.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{req.parentName}</div>
                  <div className="text-xs text-gray-500">
                    {req.email} — copil: {req.childName} ({req.childBirthYear})
                    {req.teamName && ` — ${req.teamName}`}
                  </div>
                  {req.message && <div className="text-xs text-gray-400 mt-0.5 truncate">&bdquo;{req.message}&rdquo;</div>}
                </div>
                <div className="flex gap-2 ml-3">
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={processingId === req.id}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {processingId === req.id ? '...' : 'Aproba'}
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={processingId === req.id}
                    className="text-xs text-red-500 px-3 py-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Respinge
                  </button>
                </div>
              </div>
            ))}
            {pendingRequests.length > 5 && (
              <Link href="/admin/cereri-acces" className="block text-center text-sm text-gray-500 hover:text-dinamo-blue py-2">
                + inca {pendingRequests.length - 5} cereri
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="font-heading font-bold text-lg mb-4">Acțiuni rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/admin/povesti" className="bg-blue-50 text-blue-700 p-4 rounded-lg hover:bg-blue-100 transition-colors text-center font-medium">
            + Adaugă poveste nouă
          </Link>
          <Link href="/admin/galerie" className="bg-green-50 text-green-700 p-4 rounded-lg hover:bg-green-100 transition-colors text-center font-medium">
            + Încarcă poze
          </Link>
          <Link href="/admin/meciuri" className="bg-red-50 text-red-700 p-4 rounded-lg hover:bg-red-100 transition-colors text-center font-medium">
            + Adaugă meci
          </Link>
        </div>
      </div>
    </div>
  )
}
