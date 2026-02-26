'use client'

import { useState, useEffect } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

interface Team {
  id: number
  grupa: string
}

interface Registration {
  id: string
  childFirstName: string
  childLastName: string
  birthDate: string
  teamId: number | null
  team: Team | null
  parentName: string
  phone: string
  email: string
  experience: string | null
  gdprConsent: boolean
  status: string
  notes: string | null
  createdAt: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  noua: { label: 'Noua', color: 'bg-blue-100 text-blue-700' },
  contactata: { label: 'Contactata', color: 'bg-yellow-100 text-yellow-700' },
  acceptata: { label: 'Acceptata', color: 'bg-green-100 text-green-700' },
  respinsa: { label: 'Respinsa', color: 'bg-red-100 text-red-700' },
}

export default function AdminInscrieriPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadRegistrations = () => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterTeam) params.set('teamId', filterTeam)

    fetch(`/api/admin/inscrieri?${params}`)
      .then(r => r.json())
      .then(data => {
        setRegistrations(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetch('/api/teams')
      .then(r => r.json())
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => { loadRegistrations() }, [filterStatus, filterTeam]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/inscrieri/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      showToast(`Status schimbat: ${STATUS_LABELS[status]?.label}`)
      loadRegistrations()
    } else {
      showToast('Eroare la actualizare', 'err')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sterge aceasta inscriere?')) return
    const res = await fetch(`/api/admin/inscrieri/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': getCsrfToken() },
    })
    if (res.ok) {
      showToast('Inscriere stearsa')
      loadRegistrations()
    } else {
      showToast('Eroare la stergere', 'err')
    }
  }

  const exportCSV = () => {
    const params = new URLSearchParams()
    if (filterTeam) params.set('teamId', filterTeam)
    window.open(`/api/admin/inscrieri/export?${params}`, '_blank')
  }

  const counts = {
    total: registrations.length,
    noua: registrations.filter(r => r.status === 'noua').length,
    contactata: registrations.filter(r => r.status === 'contactata').length,
    acceptata: registrations.filter(r => r.status === 'acceptata').length,
    respinsa: registrations.filter(r => r.status === 'respinsa').length,
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dinamo-blue">Inscrieri</h1>
          <p className="text-gray-500 text-sm mt-1">{counts.total} inscrieri, {counts.noua} noi</p>
        </div>
        <button onClick={exportCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
          <div key={key} className="bg-white rounded-lg shadow-sm border p-3 text-center cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setFilterStatus(filterStatus === key ? '' : key)}>
            <div className={`text-2xl font-bold ${filterStatus === key ? 'text-dinamo-red' : 'text-gray-800'}`}>
              {counts[key as keyof typeof counts]}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Toate statusurile</option>
          {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Toate echipele</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.grupa}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {registrations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500">Nicio inscriere gasita</p>
        </div>
      ) : (
        <div className="space-y-3">
          {registrations.map(r => {
            const expanded = expandedId === r.id
            const sl = STATUS_LABELS[r.status] || STATUS_LABELS.noua
            return (
              <div key={r.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expanded ? null : r.id)}>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sl.color}`}>{sl.label}</span>
                    <div>
                      <div className="font-medium text-sm">{r.childLastName} {r.childFirstName}</div>
                      <div className="text-xs text-gray-500">{r.parentName} &middot; {r.team?.grupa || 'Fara grupa'} &middot; {new Date(r.createdAt).toLocaleDateString('ro-RO')}</div>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {expanded && (
                  <div className="border-t px-4 py-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-500">Data nasterii:</span> {new Date(r.birthDate).toLocaleDateString('ro-RO')}</div>
                      <div><span className="text-gray-500">Grupa:</span> {r.team?.grupa || 'Nedecis'}</div>
                      <div><span className="text-gray-500">Telefon:</span> <a href={`tel:${r.phone}`} className="text-dinamo-red">{r.phone}</a></div>
                      <div><span className="text-gray-500">Email:</span> <a href={`mailto:${r.email}`} className="text-dinamo-red">{r.email}</a></div>
                      {r.experience && <div className="md:col-span-2"><span className="text-gray-500">Experienta:</span> {r.experience}</div>}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
                      <span className="text-xs text-gray-500 mr-2">Schimba status:</span>
                      {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
                        <button key={key} onClick={() => updateStatus(r.id, key)}
                          className={`text-xs px-2.5 py-1 rounded-full transition-colors ${r.status === key ? color + ' font-bold ring-2 ring-offset-1 ring-gray-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {label}
                        </button>
                      ))}
                      <button onClick={() => handleDelete(r.id)}
                        className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 ml-auto">
                        Sterge
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
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
