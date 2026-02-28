'use client'

import { useState, useEffect, useCallback } from 'react'

interface RequestItem {
  id: string
  type: string
  title: string
  description: string | null
  status: string
  response: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  startDate: string | null
  endDate: string | null
  createdAt: string
  parent: { id: string; name: string; email: string }
  child: { id: string; name: string } | null
}

interface Stats {
  pending: number
  approved: number
  rejected: number
}

const TYPE_LABELS: Record<string, string> = {
  absenta: 'Absenta',
  transfer: 'Transfer',
  echipament: 'Echipament',
  alta: 'Alta cerere',
}

const TYPE_COLORS: Record<string, string> = {
  absenta: 'bg-blue-100 text-blue-700',
  transfer: 'bg-purple-100 text-purple-700',
  echipament: 'bg-orange-100 text-orange-700',
  alta: 'bg-gray-100 text-gray-700',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'In asteptare',
  approved: 'Aprobata',
  rejected: 'Respinsa',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

type FilterStatus = '' | 'pending' | 'approved' | 'rejected'
type FilterType = '' | 'absenta' | 'transfer' | 'echipament' | 'alta'

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('')
  const [filterType, setFilterType] = useState<FilterType>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState<Record<string, string>>({})

  const fetchRequests = useCallback(() => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterType) params.set('type', filterType)

    fetch(`/api/admin/requests?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.requests) {
          setRequests(data.requests)
          setStats(data.stats)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filterStatus, filterType])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingId(requestId)
    try {
      const res = await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          response: responseText[requestId]?.trim() || null,
        }),
      })
      if (res.ok) {
        setExpandedId(null)
        setResponseText(prev => {
          const next = { ...prev }
          delete next[requestId]
          return next
        })
        fetchRequests()
      }
    } catch {
      // fail silently
    }
    setProcessingId(null)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ro-RO')
  const formatDateTime = (d: string) => new Date(d).toLocaleString('ro-RO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Cereri parinti</h1>
        <p className="text-gray-500 text-sm mt-1">Gestioneaza cererile de absenta, transfer si altele</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-xs text-gray-500 mt-1">In asteptare</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          <div className="text-xs text-gray-500 mt-1">Aprobate</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-xs text-gray-500 mt-1">Respinse</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none"
            >
              <option value="">Toate</option>
              <option value="pending">In asteptare</option>
              <option value="approved">Aprobate</option>
              <option value="rejected">Respinse</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tip</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none"
            >
              <option value="">Toate tipurile</option>
              <option value="absenta">Absenta</option>
              <option value="transfer">Transfer</option>
              <option value="echipament">Echipament</option>
              <option value="alta">Alta cerere</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests list */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-500">Nicio cerere gasita.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const isExpanded = expandedId === req.id
            return (
              <div key={req.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Header row - clickable */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[req.type] || TYPE_COLORS.alta}`}>
                      {TYPE_LABELS[req.type] || req.type}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[req.status] || STATUS_COLORS.pending}`}>
                      {STATUS_LABELS[req.status] || req.status}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">{formatDate(req.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <h3 className="font-heading font-bold text-gray-900">{req.title}</h3>
                    <span className="text-sm text-gray-500">
                      {req.parent.name}
                      {req.child && <span className="text-gray-400"> / {req.child.name}</span>}
                    </span>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Parinte:</span>{' '}
                        <span className="font-medium">{req.parent.name}</span>
                        <span className="text-gray-400 ml-1">({req.parent.email})</span>
                      </div>
                      {req.child && (
                        <div>
                          <span className="text-gray-500">Copil:</span>{' '}
                          <span className="font-medium">{req.child.name}</span>
                        </div>
                      )}
                      {req.startDate && (
                        <div>
                          <span className="text-gray-500">De la:</span>{' '}
                          <span className="font-medium">{formatDate(req.startDate)}</span>
                        </div>
                      )}
                      {req.endDate && (
                        <div>
                          <span className="text-gray-500">Pana la:</span>{' '}
                          <span className="font-medium">{formatDate(req.endDate)}</span>
                        </div>
                      )}
                    </div>

                    {req.description && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Descriere:</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{req.description}</p>
                      </div>
                    )}

                    {req.response && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-medium text-blue-600 mb-1">
                          Raspuns de {req.reviewedBy || 'admin'} ({req.reviewedAt ? formatDateTime(req.reviewedAt) : ''}):
                        </p>
                        <p className="text-sm text-gray-700">{req.response}</p>
                      </div>
                    )}

                    {req.status === 'pending' && (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Raspuns (optional)</label>
                          <textarea
                            value={responseText[req.id] || ''}
                            onChange={e => setResponseText(prev => ({ ...prev, [req.id]: e.target.value }))}
                            rows={2}
                            placeholder="Adauga un raspuns..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none resize-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAction(req.id, 'approve')}
                            disabled={processingId === req.id}
                            className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {processingId === req.id ? '...' : 'Aproba'}
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'reject')}
                            disabled={processingId === req.id}
                            className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {processingId === req.id ? '...' : 'Respinge'}
                          </button>
                        </div>
                      </div>
                    )}

                    {req.status !== 'pending' && !req.response && req.reviewedAt && (
                      <p className="text-xs text-gray-400">
                        {req.status === 'approved' ? 'Aprobata' : 'Respinsa'} de {req.reviewedBy || 'admin'} pe {formatDateTime(req.reviewedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
