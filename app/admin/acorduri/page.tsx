'use client'

import { useState, useEffect } from 'react'

interface ChildRecord {
  id: string
  name: string
  birthYear: number
  teamId: number | null
  teamName: string | null
  photoConsent: boolean
  photoConsentWA: boolean
  photoConsentDate: string | null
  signatureData: boolean
  parentId: string
  parentName: string
  parentEmail: string
  parentPhone: string | null
}

interface TeamStat {
  teamId: number
  teamName: string
  total: number
  signed: number
  unsigned: number
}

interface Stats {
  total: number
  signed: number
  unsigned: number
  byTeam: TeamStat[]
}

interface TeamOption {
  id: number
  grupa: string
}

export default function AdminAcorduriPage() {
  const [children, setChildren] = useState<ChildRecord[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, signed: 0, unsigned: 0, byTeam: [] })
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [filterTeam, setFilterTeam] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [signatureModal, setSignatureModal] = useState<{ childName: string; src: string } | null>(null)
  const [loadingSignature, setLoadingSignature] = useState(false)
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)
  const [sendingBulk, setSendingBulk] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

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

  const viewSignature = async (childId: string, childName: string) => {
    setLoadingSignature(true)
    try {
      const res = await fetch(`/api/admin/acorduri/signature/${childId}`)
      if (!res.ok) { showToast('Nu s-a putut incarca semnatura', 'err'); return }
      const data = await res.json()
      if (data.signatureData) {
        setSignatureModal({ childName, src: data.signatureData })
      } else {
        showToast('Semnatura nu este disponibila', 'err')
      }
    } catch {
      showToast('Eroare la incarcarea semnaturii', 'err')
    } finally {
      setLoadingSignature(false)
    }
  }

  const sendReminder = async (childId: string) => {
    setSendingReminder(childId)
    try {
      const res = await fetch(`/api/admin/acorduri/reminder/${childId}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || 'Reminder trimis!')
      } else {
        showToast(data.error || 'Eroare', 'err')
      }
    } catch {
      showToast('Eroare de conexiune', 'err')
    } finally {
      setSendingReminder(null)
    }
  }

  const sendBulkReminders = async () => {
    if (!confirm(`Trimiti remindere catre toti parintii cu acorduri nesemnate (${stats.unsigned} copii)?`)) return
    setSendingBulk(true)
    try {
      const res = await fetch('/api/admin/acorduri/reminder-bulk', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || `Trimise: ${data.sent}`)
      } else {
        showToast(data.error || 'Eroare', 'err')
      }
    } catch {
      showToast('Eroare de conexiune', 'err')
    } finally {
      setSendingBulk(false)
    }
  }

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
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Signature Modal */}
      {signatureModal && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" onClick={() => setSignatureModal(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Semnatura — {signatureModal.childName}</h3>
              <button onClick={() => setSignatureModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              <img src={signatureModal.src} alt="Semnatura" className="w-full" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Acorduri foto</h1>
        <div className="flex gap-2">
          {stats.unsigned > 0 && (
            <button
              onClick={sendBulkReminders}
              disabled={sendingBulk}
              className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition-colors text-sm disabled:opacity-50"
            >
              {sendingBulk ? 'Se trimit...' : `Trimite remindere (${stats.unsigned})`}
            </button>
          )}
          <a
            href="/api/admin/acorduri/export"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
          >
            Export CSV
          </a>
        </div>
      </div>

      {/* Global Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-dinamo-blue">{percent}%</div>
          <div className="flex-1">
            <div className="text-sm text-gray-600">
              {stats.signed} din {stats.total} acorduri semnate
              {stats.unsigned > 0 && <span className="text-amber-600 ml-2">({stats.unsigned} nesemnate)</span>}
            </div>
            <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full mt-1">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Per-team Stats */}
      {stats.byTeam.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {stats.byTeam.map(t => {
            const tp = t.total > 0 ? Math.round((t.signed / t.total) * 100) : 0
            return (
              <div key={t.teamId} className="bg-white rounded-lg shadow-sm border p-3 text-center">
                <div className="font-bold text-sm text-dinamo-blue">{t.teamName}</div>
                <div className="text-2xl font-bold mt-1">{tp}%</div>
                <div className="text-xs text-gray-500">{t.signed}/{t.total}</div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${tp}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

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
              <th className="text-left px-4 py-3 font-medium">Contact</th>
              <th className="text-center px-4 py-3 font-medium">Actiuni</th>
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
                  <td className="px-4 py-3">{child.teamName || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {child.photoConsentDate ? (
                      child.photoConsent
                        ? <span className="text-green-600 font-medium">Da</span>
                        : <span className="text-red-500 font-medium">Nu</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {child.photoConsentDate ? (
                      child.photoConsentWA
                        ? <span className="text-green-600 font-medium">Da</span>
                        : <span className="text-red-500 font-medium">Nu</span>
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
                  <td className="px-4 py-3">
                    <div className="text-xs">{child.parentEmail}</div>
                    {child.parentPhone && <div className="text-xs text-gray-500">{child.parentPhone}</div>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {child.signatureData && (
                        <button
                          onClick={() => viewSignature(child.id, child.name)}
                          disabled={loadingSignature}
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                          title="Vezi semnatura"
                        >
                          Semnatura
                        </button>
                      )}
                      {!child.photoConsentDate && (
                        <button
                          onClick={() => sendReminder(child.id)}
                          disabled={sendingReminder === child.id}
                          className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded hover:bg-amber-100 transition-colors"
                          title="Trimite reminder"
                        >
                          {sendingReminder === child.id ? '...' : 'Reminder'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
