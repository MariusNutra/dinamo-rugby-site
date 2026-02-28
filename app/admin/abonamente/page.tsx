'use client'

import { useState, useEffect } from 'react'

interface Subscription {
  id: string
  status: string
  customerEmail: string
  customerName: string
  childName: string
  amount: number
  currency: string
  currentPeriodStart: string
  currentPeriodEnd: string
  canceledAt: string | null
  createdAt: string
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-yellow-100 text-yellow-700',
  canceled: 'bg-red-100 text-red-700',
  incomplete: 'bg-orange-100 text-orange-700',
  trialing: 'bg-blue-100 text-blue-700',
  unpaid: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  active: 'Activ',
  past_due: 'Întârziat',
  canceled: 'Anulat',
  incomplete: 'Incomplet',
  trialing: 'Trial',
  unpaid: 'Neplătit',
}

export default function AdminAbonamentePage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/subscriptions')
      .then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then(data => {
        setSubscriptions(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setError('Nu s-au putut încărca abonamentele. Verifică configurarea Stripe.')
        setLoading(false)
      })
  }, [])

  const activeSubs = subscriptions.filter(s => s.status === 'active')
  const totalMRR = activeSubs.reduce((sum, s) => sum + s.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl">Abonamente</h1>
        <p className="text-sm text-gray-400">Cotizații lunare recurente via Stripe</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-xs text-gray-400 font-medium uppercase">Abonamente active</p>
          <p className="text-2xl font-heading font-bold text-green-600 mt-1">{activeSubs.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-xs text-gray-400 font-medium uppercase">Venit lunar recurent</p>
          <p className="text-2xl font-heading font-bold text-dinamo-red mt-1">{totalMRR.toLocaleString('ro-RO')} RON</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-xs text-gray-400 font-medium uppercase">Total abonamente</p>
          <p className="text-2xl font-heading font-bold text-gray-700 mt-1">{subscriptions.length}</p>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔄</span>
          </div>
          <h3 className="font-heading font-bold text-lg text-gray-600 mb-1">Niciun abonament</h3>
          <p className="text-gray-400 text-sm">Abonamentele vor apărea aici când părinții activează cotizația lunară.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Părinte</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Sportiv</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Sumă</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Perioadă</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Creat</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(sub => (
                  <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{sub.customerName || '—'}</div>
                      <div className="text-xs text-gray-500">{sub.customerEmail}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{sub.childName || '—'}</td>
                    <td className="px-5 py-3 font-bold text-gray-900">{sub.amount} RON/lună</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${statusColors[sub.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[sub.status] || sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(sub.currentPeriodStart).toLocaleDateString('ro-RO')} — {new Date(sub.currentPeriodEnd).toLocaleDateString('ro-RO')}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(sub.createdAt).toLocaleDateString('ro-RO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
