'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
  child: { id: string; name: string } | null
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

export default function ParentRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/parinti/requests')
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(data => {
        setRequests(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ro-RO')

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dinamo-blue">Cererile mele</h1>
          <p className="text-gray-500 text-sm mt-1">Absente, transferuri si alte cereri</p>
        </div>
        <Link
          href="/parinti/cereri/nou"
          className="bg-dinamo-red text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          + Cerere noua
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 font-medium">Nu ai nicio cerere momentan.</p>
          <p className="text-gray-400 text-sm mt-1">Apasa butonul &quot;Cerere noua&quot; pentru a trimite o cerere.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl shadow-md p-5">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[req.type] || TYPE_COLORS.alta}`}>
                    {TYPE_LABELS[req.type] || req.type}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[req.status] || STATUS_COLORS.pending}`}>
                    {STATUS_LABELS[req.status] || req.status}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{formatDate(req.createdAt)}</span>
              </div>

              <h3 className="font-heading font-bold text-gray-900 mb-1">{req.title}</h3>

              {req.child && (
                <p className="text-sm text-gray-500 mb-1">
                  Copil: <span className="font-medium text-gray-700">{req.child.name}</span>
                </p>
              )}

              {req.description && (
                <p className="text-sm text-gray-600 mt-2">{req.description}</p>
              )}

              {(req.startDate || req.endDate) && (
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  {req.startDate && <span>De la: <span className="font-medium">{formatDate(req.startDate)}</span></span>}
                  {req.endDate && <span>Pana la: <span className="font-medium">{formatDate(req.endDate)}</span></span>}
                </div>
              )}

              {req.response && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-1">Raspunsul clubului:</p>
                  <p className="text-sm text-gray-700">{req.response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
