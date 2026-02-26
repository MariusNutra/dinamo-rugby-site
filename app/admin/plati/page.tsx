'use client'

import { useState, useEffect } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

interface PaymentRecord {
  id: string
  amount: number
  type: string
  status: string
  description: string | null
  receiptNumber: string | null
  createdAt: string
  parent: { name: string; email: string } | null
  child: { name: string; birthYear: number; team: { grupa: string } | null } | null
}

interface TeamOption {
  id: number
  grupa: string
}

export default function AdminPlatiPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [filterTeam, setFilterTeam] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [sendingReminder, setSendingReminder] = useState(false)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadPayments = () => {
    const params = new URLSearchParams()
    if (filterTeam) params.set('teamId', filterTeam)
    if (filterStatus) params.set('status', filterStatus)
    if (filterType) params.set('type', filterType)

    fetch(`/api/admin/plati?${params}`)
      .then(r => r.json())
      .then(data => {
        setPayments(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetch('/api/teams?active=1')
      .then(r => r.json())
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => { loadPayments() }, [filterTeam, filterStatus, filterType]) // eslint-disable-line react-hooks/exhaustive-deps

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      completed: 'Platit',
      pending: 'In asteptare',
      failed: 'Esuat',
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const handleSendReminders = async () => {
    const pendingPayments = payments.filter(p => p.status === 'pending')
    const parentIdSet = new Set<string>()
    for (const p of pendingPayments) {
      const pid = (p as unknown as { parentId: string }).parentId
      if (pid) parentIdSet.add(pid)
    }
    const parentIds = Array.from(parentIdSet)

    if (parentIds.length === 0) {
      showToast('Nu exista restantieri', 'err')
      return
    }

    if (!confirm(`Trimite reminder catre ${parentIds.length} parinti?`)) return

    setSendingReminder(true)
    try {
      const res = await fetch('/api/admin/plati/reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({ parentIds }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Reminder trimis catre ${data.sent} parinti`)
      } else {
        showToast(data.error || 'Eroare', 'err')
      }
    } catch {
      showToast('Eroare la trimitere', 'err')
    }
    setSendingReminder(false)
  }

  // Stats
  const totalCompleted = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const completedCount = payments.filter(p => p.status === 'completed').length
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const thisMonthCount = payments.filter(p => {
    const d = new Date(p.createdAt)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && p.status === 'completed'
  }).length

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-dinamo-blue">Plati & Cotizatii</h1>
        <button
          onClick={handleSendReminders}
          disabled={sendingReminder}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {sendingReminder ? 'Se trimite...' : 'Trimite reminder restantieri'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalCompleted.toLocaleString('ro-RO')} RON</div>
          <div className="text-xs text-gray-500 mt-1">Total incasat</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{totalPending.toLocaleString('ro-RO')} RON</div>
          <div className="text-xs text-gray-500 mt-1">Restante</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-dinamo-blue">{completedCount}</div>
          <div className="text-xs text-gray-500 mt-1">Plati completate</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-dinamo-red">{thisMonthCount}</div>
          <div className="text-xs text-gray-500 mt-1">Plati luna curenta</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Toate echipele</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.grupa}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Toate statusurile</option>
          <option value="completed">Platit</option>
          <option value="pending">In asteptare</option>
          <option value="failed">Esuat</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Toate tipurile</option>
          <option value="cotizatie">Cotizatie</option>
          <option value="inscriere">Inscriere</option>
          <option value="donatie">Donatie</option>
        </select>
      </div>

      {/* Table */}
      {payments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <div className="text-4xl mb-3">💳</div>
          <p className="text-gray-500">Nicio plata inregistrata</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Parinte</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sportiv</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Echipa</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tip</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Suma</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Referinta</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{p.parent?.name || '—'}</td>
                  <td className="px-4 py-3">{p.child?.name || '—'}</td>
                  <td className="px-4 py-3">{p.child?.team?.grupa || '—'}</td>
                  <td className="px-4 py-3 capitalize">{p.type}</td>
                  <td className="px-4 py-3 text-right font-bold">{p.amount.toLocaleString('ro-RO')} RON</td>
                  <td className="px-4 py-3 text-center">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.receiptNumber || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString('ro-RO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
