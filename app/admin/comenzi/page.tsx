'use client'

import { useState, useEffect } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  product: { name: string; image: string | null }
}

interface Order {
  id: string
  customerName: string
  email: string
  phone: string | null
  total: number
  status: string
  shippingAddress: string | null
  notes: string | null
  stripeSessionId: string | null
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

const STATUS_COLORS: Record<string, string> = {
  noua: 'bg-blue-100 text-blue-700',
  platita: 'bg-green-100 text-green-700',
  procesare: 'bg-yellow-100 text-yellow-700',
  expediat: 'bg-purple-100 text-purple-700',
  livrat: 'bg-gray-100 text-gray-700',
  anulat: 'bg-red-100 text-red-700',
  eroare: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  noua: 'Noua',
  platita: 'Platita',
  procesare: 'In procesare',
  expediat: 'Expediata',
  livrat: 'Livrata',
  anulat: 'Anulata',
  eroare: 'Eroare',
}

const VALID_STATUSES = ['noua', 'platita', 'procesare', 'expediat', 'livrat', 'anulat']

export default function AdminComenziPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadOrders = () => {
    fetch('/api/admin/orders')
      .then(r => r.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadOrders() }, [])

  const updateStatus = async (orderId: string, newStatus: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCsrfToken(),
      },
      body: JSON.stringify({ status: newStatus }),
    })

    if (res.ok) {
      showToast(`Status actualizat: ${STATUS_LABELS[newStatus] || newStatus}`)
      loadOrders()
    } else {
      showToast('Eroare la actualizarea statusului', 'err')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
      <h1 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">Comenzi</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md border">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📦</span>
          </div>
          <p className="text-gray-500 font-medium">Nicio comanda momentan</p>
          <p className="text-gray-400 text-sm mt-1">Comenzile din magazin vor aparea aici</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-dinamo-blue">{orders.length}</div>
              <div className="text-xs text-gray-500 mt-1">Total comenzi</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'noua').length}</div>
              <div className="text-xs text-gray-500 mt-1">Noi</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'platita').length}</div>
              <div className="text-xs text-gray-500 mt-1">Platite</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-dinamo-red">
                {orders.filter(o => o.status === 'platita' || o.status === 'livrat').reduce((sum, o) => sum + o.total, 0).toLocaleString('ro-RO')} RON
              </div>
              <div className="text-xs text-gray-500 mt-1">Venituri</div>
            </div>
          </div>

          {/* Orders table - desktop */}
          <div className="hidden md:block bg-white rounded-xl shadow-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <>
                    <tr key={order.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-500">{order.id.substring(0, 8)}...</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        {order.phone && <div className="text-xs text-gray-400">{order.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{order.email}</td>
                      <td className="px-4 py-3 text-right font-bold text-dinamo-red">
                        {order.total.toLocaleString('ro-RO')} RON
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end items-center">
                          <button
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                          >
                            {expandedOrder === order.id ? 'Ascunde' : 'Detalii'}
                          </button>
                          <select
                            value={order.status}
                            onChange={e => updateStatus(order.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                          >
                            {VALID_STATUSES.map(s => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                    {expandedOrder === order.id && (
                      <tr key={`${order.id}-detail`} className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-bold text-sm text-gray-700 mb-2">Produse comandate</h4>
                              <div className="space-y-2">
                                {order.items.map(item => (
                                  <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border">
                                    {item.product.image && (
                                      <img src={item.product.image} alt={item.name} className="w-10 h-10 rounded object-cover" />
                                    )}
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{item.name}</div>
                                      <div className="text-xs text-gray-500">{item.quantity} x {item.price.toLocaleString('ro-RO')} RON</div>
                                    </div>
                                    <div className="font-bold text-sm text-dinamo-red">
                                      {(item.price * item.quantity).toLocaleString('ro-RO')} RON
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              {order.shippingAddress && (
                                <div>
                                  <span className="font-medium text-gray-600">Adresa livrare:</span>
                                  <p className="text-gray-800 mt-0.5">{order.shippingAddress}</p>
                                </div>
                              )}
                              {order.notes && (
                                <div>
                                  <span className="font-medium text-gray-600">Note:</span>
                                  <p className="text-gray-800 mt-0.5">{order.notes}</p>
                                </div>
                              )}
                              {order.stripeSessionId && (
                                <div>
                                  <span className="font-medium text-gray-600">Stripe Session:</span>
                                  <p className="text-gray-500 font-mono text-xs mt-0.5 break-all">{order.stripeSessionId}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Orders cards - mobile */}
          <div className="md:hidden space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-gray-900">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.email}</div>
                      {order.phone && <div className="text-xs text-gray-400">{order.phone}</div>}
                    </div>
                    <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-lg text-dinamo-red">{order.total.toLocaleString('ro-RO')} RON</span>
                    <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="flex-1 px-3 py-2 text-xs bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                    >
                      {expandedOrder === order.id ? 'Ascunde detalii' : 'Vezi detalii'}
                    </button>
                    <select
                      value={order.status}
                      onChange={e => updateStatus(order.id, e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                    >
                      {VALID_STATUSES.map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="border-t bg-gray-50 p-4 space-y-3">
                    <h4 className="font-bold text-sm text-gray-700">Produse</h4>
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border">
                        {item.product.image && (
                          <img src={item.product.image} alt={item.name} className="w-10 h-10 rounded object-cover" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.quantity} x {item.price.toLocaleString('ro-RO')} RON</div>
                        </div>
                        <div className="font-bold text-sm text-dinamo-red">
                          {(item.price * item.quantity).toLocaleString('ro-RO')} RON
                        </div>
                      </div>
                    ))}
                    {order.shippingAddress && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Adresa:</span>
                        <p className="text-gray-800 mt-0.5">{order.shippingAddress}</p>
                      </div>
                    )}
                    <div className="text-xs text-gray-400 font-mono">ID: {order.id}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
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
