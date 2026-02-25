'use client'

import { useState, useEffect } from 'react'

interface ChildRecord {
  id: string
  name: string
  birthYear: number
  teamName: string
  teamId: number | null
  photoConsent: boolean
  photoConsentWA: boolean
  photoConsentDate: string | null
  parentName: string
  parentEmail: string
  parentPhone: string | null
}

interface TeamOption {
  id: number
  grupa: string
}

export default function AdminAcorduriPage() {
  const [children, setChildren] = useState<ChildRecord[]>([])
  const [stats, setStats] = useState({ total: 0, signed: 0 })
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [filterTeam, setFilterTeam] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    const params = new URLSearchParams()
    if (filterTeam) params.set('teamId', filterTeam)
    if (filterStatus) params.set('status', filterStatus)

    fetch(`/api/admin/acorduri?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.children) {
          setChildren(data.children)
          setStats(data.stats)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetch('/api/teams?active=1')
      .then(r => r.ok ? r.json() : [])
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTeam, filterStatus])

  const percent = stats.total > 0 ? Math.round((stats.signed / stats.total) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Acorduri foto</h1>
        <a
          href="/api/admin/acorduri/export"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
        >
          Export CSV
        </a>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-dinamo-blue">{percent}%</div>
          <div>
            <div className="text-sm text-gray-600">
              {stats.signed} din {stats.total} acorduri semnate
            </div>
            <div className="w-48 h-2 bg-gray-200 rounded-full mt-1">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={filterTeam}
          onChange={e => setFilterTeam(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Toate echipele</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.grupa}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Toate</option>
          <option value="signed">Semnate</option>
          <option value="unsigned">Nesemnate</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium">Copil</th>
              <th className="text-left px-4 py-3 font-medium">An</th>
              <th className="text-left px-4 py-3 font-medium">Echipa</th>
              <th className="text-center px-4 py-3 font-medium">Site</th>
              <th className="text-center px-4 py-3 font-medium">WA</th>
              <th className="text-left px-4 py-3 font-medium">Data</th>
              <th className="text-left px-4 py-3 font-medium">Parinte</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Telefon</th>
            </tr>
          </thead>
          <tbody>
            {children.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500">
                  Niciun rezultat.
                </td>
              </tr>
            ) : (
              children.map(child => (
                <tr key={child.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{child.name}</td>
                  <td className="px-4 py-3">{child.birthYear}</td>
                  <td className="px-4 py-3">{child.teamName}</td>
                  <td className="px-4 py-3 text-center">
                    {child.photoConsentDate ? (
                      child.photoConsent
                        ? <span className="text-green-600">Da</span>
                        : <span className="text-red-500">Nu</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {child.photoConsentDate ? (
                      child.photoConsentWA
                        ? <span className="text-green-600">Da</span>
                        : <span className="text-red-500">Nu</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {child.photoConsentDate
                      ? new Date(child.photoConsentDate).toLocaleDateString('ro-RO')
                      : <span className="text-amber-600 font-medium">Nesemnat</span>
                    }
                  </td>
                  <td className="px-4 py-3">{child.parentName}</td>
                  <td className="px-4 py-3">{child.parentEmail}</td>
                  <td className="px-4 py-3">{child.parentPhone || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
