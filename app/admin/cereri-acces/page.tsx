'use client'

import { useState, useEffect, useCallback } from 'react'

interface AccessRequest {
  id: string
  parentName: string
  email: string
  phone: string | null
  childName: string
  childBirthYear: number
  teamId: number | null
  teamName: string | null
  message: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewedAt: string | null
  reviewedBy: string | null
  createdAt: string
}

type FilterStatus = '' | 'pending' | 'approved' | 'rejected'

const REJECTION_REASONS = [
  'Echipa e plina',
  'Varsta nu corespunde',
  'Contactati antrenorul',
  'Alt motiv',
]

export default function AdminCereriAccesPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectCustom, setRejectCustom] = useState('')

  const fetchRequests = useCallback(() => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)

    fetch(`/api/admin/cereri-acces?${params}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRequests(data)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filterStatus])

  useEffect(() => {
    setLoading(true)
    fetchRequests()
  }, [fetchRequests])

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const handleApprove = async (id: string) => {
    if (!confirm('Sigur vrei sa aprobi aceasta cerere?')) return
    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/cereri-acces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (res.ok) {
        fetchRequests()
      } else {
        const data = await res.json()
        alert(data.error || 'Eroare la aprobare')
      }
    } catch {
      alert('Eroare de retea')
    }
    setProcessingId(null)
  }

  const handleReject = async (id: string) => {
    const reason = rejectReason === 'Alt motiv' ? rejectCustom : rejectReason
    if (!reason) {
      alert('Selecteaza un motiv')
      return
    }

    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/cereri-acces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      })
      if (res.ok) {
        setRejectingId(null)
        setRejectReason('')
        setRejectCustom('')
        fetchRequests()
      } else {
        const data = await res.json()
        alert(data.error || 'Eroare la respingere')
      }
    } catch {
      alert('Eroare de retea')
    }
    setProcessingId(null)
  }

  const openRejectForm = (id: string) => {
    setRejectingId(id)
    setRejectReason('')
    setRejectCustom('')
  }

  const cancelReject = () => {
    setRejectingId(null)
    setRejectReason('')
    setRejectCustom('')
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">In asteptare</span>
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aprobat</span>
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Respins</span>
      default:
        return null
    }
  }

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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Cereri acces</h1>
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingCount} in asteptare
            </span>
          )}
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as FilterStatus)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Toate</option>
          <option value="pending">In asteptare</option>
          <option value="approved">Aprobate</option>
          <option value="rejected">Respinse</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium">Data</th>
              <th className="text-left px-4 py-3 font-medium">Nume parinte</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Telefon</th>
              <th className="text-left px-4 py-3 font-medium">Copil</th>
              <th className="text-left px-4 py-3 font-medium">An nastere</th>
              <th className="text-left px-4 py-3 font-medium">Echipa</th>
              <th className="text-left px-4 py-3 font-medium">Mesaj</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actiuni</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-500">
                  Niciun rezultat.
                </td>
              </tr>
            ) : (
              requests.map(req => (
                <tr key={req.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    {new Date(req.createdAt).toLocaleDateString('ro-RO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium">{req.parentName}</td>
                  <td className="px-4 py-3">{req.email}</td>
                  <td className="px-4 py-3">{req.phone || '—'}</td>
                  <td className="px-4 py-3 font-medium">{req.childName}</td>
                  <td className="px-4 py-3">{req.childBirthYear}</td>
                  <td className="px-4 py-3">{req.teamName || '—'}</td>
                  <td className="px-4 py-3 max-w-[200px]">
                    {req.message ? (
                      <span className="text-gray-600 truncate block" title={req.message}>
                        {req.message}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {statusBadge(req.status)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {req.status === 'pending' && (
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={processingId === req.id}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {processingId === req.id ? '...' : 'Aproba'}
                          </button>
                          <button
                            onClick={() => openRejectForm(req.id)}
                            disabled={processingId === req.id}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Respinge
                          </button>
                        </div>

                        {rejectingId === req.id && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-1 w-64 text-left">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Motiv respingere</label>
                            <select
                              value={rejectReason}
                              onChange={e => {
                                setRejectReason(e.target.value)
                                if (e.target.value !== 'Alt motiv') setRejectCustom('')
                              }}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs mb-2"
                            >
                              <option value="">— Selecteaza —</option>
                              {REJECTION_REASONS.map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            {rejectReason === 'Alt motiv' && (
                              <input
                                type="text"
                                placeholder="Scrie motivul..."
                                value={rejectCustom}
                                onChange={e => setRejectCustom(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs mb-2"
                              />
                            )}
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleReject(req.id)}
                                disabled={processingId === req.id}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex-1"
                              >
                                {processingId === req.id ? 'Se proceseaza...' : 'Confirma'}
                              </button>
                              <button
                                onClick={cancelReject}
                                className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                              >
                                Anuleaza
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
