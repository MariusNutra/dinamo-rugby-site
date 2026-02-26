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
  rejectionReason: string | null
  createdAt: string
}

interface ConfirmDialog {
  reg: Registration
  newStatus: string
  teamId: number | null
  rejectionReason: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  noua: { label: 'Noua', color: 'bg-blue-100 text-blue-700' },
  contactata: { label: 'Contactata', color: 'bg-yellow-100 text-yellow-700' },
  acceptata: { label: 'Acceptata', color: 'bg-green-100 text-green-700' },
  respinsa: { label: 'Respinsa', color: 'bg-red-100 text-red-700' },
}

const EMAIL_PREVIEW: Record<string, (reg: Registration) => { subject: string; summary: string }> = {
  contactata: (reg) => ({
    subject: `Am primit cererea de inscriere pentru ${reg.childFirstName} ${reg.childLastName}`,
    summary: 'Se va trimite un email de confirmare a primirii cererii. Parintele va fi informat ca va fi contactat telefonic.',
  }),
  acceptata: (reg) => ({
    subject: `Felicitari! Inscrierea lui ${reg.childFirstName} ${reg.childLastName} la CS Dinamo București Rugby a fost acceptata!`,
    summary: 'Se va trimite un email cu: grupa repartizata, program antrenamente, ce trebuie adus, informatii antrenor si link de acces la Portalul Parintilor.',
  }),
  respinsa: () => ({
    subject: 'Informare privind cererea de inscriere',
    summary: 'Se va trimite un email prin care parintele este informat ca cererea nu a fost acceptata, impreuna cu motivul respingerii.',
  }),
}

export default function AdminInscrieriPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

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

  const openConfirmDialog = (reg: Registration, newStatus: string) => {
    // For 'noua' status, update directly without dialog
    if (newStatus === 'noua') {
      updateStatus(reg.id, 'noua', {})
      return
    }
    setConfirmDialog({
      reg,
      newStatus,
      teamId: reg.teamId,
      rejectionReason: '',
    })
  }

  const updateStatus = async (id: string, status: string, extra: { rejectionReason?: string; teamId?: number | null }) => {
    setConfirmLoading(true)
    try {
      const res = await fetch(`/api/admin/inscrieri/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify({ status, ...extra }),
      })
      if (res.ok) {
        const data = await res.json()
        const statusLabel = STATUS_LABELS[status]?.label || status
        let msg = `Status schimbat: ${statusLabel}`
        if (status === 'acceptata' && data.childCreated) {
          msg += ' — Sportiv creat automat'
        }
        if (status !== 'noua') {
          msg += ' — Email trimis'
        }
        showToast(msg)
        loadRegistrations()
      } else {
        const errData = await res.json().catch(() => ({}))
        showToast(errData.error || 'Eroare la actualizare', 'err')
      }
    } catch {
      showToast('Eroare la actualizare', 'err')
    } finally {
      setConfirmLoading(false)
      setConfirmDialog(null)
    }
  }

  const handleConfirm = () => {
    if (!confirmDialog) return
    const { reg, newStatus, teamId, rejectionReason } = confirmDialog
    updateStatus(reg.id, newStatus, {
      ...(newStatus === 'respinsa' && { rejectionReason }),
      ...(newStatus === 'acceptata' && { teamId }),
    })
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

  const isConfirmDisabled = confirmDialog?.newStatus === 'respinsa' && !confirmDialog.rejectionReason.trim()

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

      {/* Card: In asteptare plata */}
      {counts.acceptata > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="text-2xl">💰</div>
          <div>
            <p className="font-medium text-amber-800">
              {counts.acceptata} {counts.acceptata === 1 ? 'inscriere acceptata' : 'inscrieri acceptate'} &mdash; verificati plata cotizatiei
            </p>
            <p className="text-sm text-amber-600 mt-0.5">Asigurati-va ca parintii au efectuat plata inainte de primul antrenament.</p>
          </div>
        </div>
      )}

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
                      {r.rejectionReason && <div className="md:col-span-2"><span className="text-gray-500">Motiv respingere:</span> <span className="text-red-600">{r.rejectionReason}</span></div>}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
                      <span className="text-xs text-gray-500 mr-2">Schimba status:</span>
                      {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
                        <button key={key} onClick={() => openConfirmDialog(r, key)}
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

      {/* Confirmation Dialog */}
      {confirmDialog && (() => {
        const preview = EMAIL_PREVIEW[confirmDialog.newStatus]?.(confirmDialog.reg)
        const statusLabel = STATUS_LABELS[confirmDialog.newStatus]?.label || confirmDialog.newStatus
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !confirmLoading && setConfirmDialog(null)}>
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-dinamo-blue">
                  Schimba status la &ldquo;{statusLabel}&rdquo;
                </h3>
                <p className="text-sm text-gray-600">
                  <strong>{confirmDialog.reg.childLastName} {confirmDialog.reg.childFirstName}</strong> &mdash; {confirmDialog.reg.parentName}
                </p>

                {/* Email preview */}
                {preview && (
                  <div className="bg-gray-50 rounded-lg p-4 border text-sm space-y-2">
                    <p className="font-medium text-gray-700">Email catre parinte:</p>
                    <p className="text-gray-600"><strong>Subiect:</strong> {preview.subject}</p>
                    <p className="text-gray-500">{preview.summary}</p>
                  </div>
                )}

                {/* Grupa selector for acceptata */}
                {confirmDialog.newStatus === 'acceptata' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Grupa repartizata:</label>
                    <select
                      value={confirmDialog.teamId || ''}
                      onChange={e => setConfirmDialog({ ...confirmDialog, teamId: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Selecteaza grupa</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.grupa}</option>
                      ))}
                    </select>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                      Se va crea automat sportivul in baza de date si se va genera un link de acces la Portalul Parintilor.
                    </div>
                  </div>
                )}

                {/* Rejection reason for respinsa */}
                {confirmDialog.newStatus === 'respinsa' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Motivul respingerii: <span className="text-red-500">*</span></label>
                    <textarea
                      value={confirmDialog.rejectionReason}
                      onChange={e => setConfirmDialog({ ...confirmDialog, rejectionReason: e.target.value })}
                      placeholder="Explicati motivul respingerii..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleConfirm}
                    disabled={confirmLoading || !!isConfirmDisabled || (confirmDialog.newStatus === 'acceptata' && !confirmDialog.teamId)}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {confirmLoading && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>}
                    {confirmLoading ? 'Se proceseaza...' : 'Confirma si trimite email'}
                  </button>
                  <button
                    onClick={() => setConfirmDialog(null)}
                    disabled={confirmLoading}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Anuleaza
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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
