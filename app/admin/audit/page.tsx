'use client'

import { useEffect, useState } from 'react'

interface AuditEntry {
  id: string
  username: string | null
  action: string
  entity: string
  entityId: string | null
  details: string | null
  ip: string | null
  createdAt: string
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch(`/api/admin/audit?limit=100${filter ? `&entity=${filter}` : ''}`)
      .then(r => r.json())
      .then(data => { setLogs(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl">Jurnal Activitate</h1>
          <p className="text-sm text-gray-400 mt-1">{logs.length} intrari recente</p>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
        >
          <option value="">Toate entitatile</option>
          <option value="coach">Antrenori</option>
          <option value="team">Echipe</option>
          <option value="user">Utilizatori</option>
          <option value="child">Sportivi</option>
          <option value="story">Povesti</option>
          <option value="match">Meciuri</option>
          <option value="payment">Plati</option>
          <option value="evaluation">Evaluari</option>
          <option value="document">Documente</option>
        </select>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-400">
          Nu exista intrari in jurnal.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Data</th>
                  <th className="text-left px-4 py-3">Utilizator</th>
                  <th className="text-center px-4 py-3">Actiune</th>
                  <th className="text-left px-4 py-3">Entitate</th>
                  <th className="text-left px-4 py-3">Detalii</th>
                  <th className="text-left px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/80">
                    <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('ro-RO')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {log.username || '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {log.entity}
                      {log.entityId && <span className="text-gray-400 ml-1 text-xs">#{log.entityId.slice(0, 8)}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[300px] truncate">
                      {log.details || '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                      {log.ip || '\u2014'}
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
