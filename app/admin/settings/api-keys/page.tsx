'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getCsrfToken } from '@/lib/csrf-client'

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  rateLimitPerMinute: number
  lastUsedAt: string | null
  active: boolean
  createdAt: string
}

const ENDPOINT_OPTIONS = [
  { value: 'teams', label: 'Echipe (teams)' },
  { value: 'matches', label: 'Meciuri (matches)' },
  { value: 'calendar', label: 'Calendar (calendar)' },
  { value: 'standings', label: 'Clasamente (standings)' },
  { value: 'athletes', label: 'Sportivi (athletes)' },
]

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRateLimit, setNewRateLimit] = useState(60)
  const [newPermissions, setNewPermissions] = useState<string[]>([])
  const [allEndpoints, setAllEndpoints] = useState(true)
  const [creating, setCreating] = useState(false)

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Copied key
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const router = useRouter()

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const loadApiKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/api-keys')
      if (res.status === 401) {
        router.push('/admin/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setApiKeys(data)
      }
    } catch {
      setError('Eroare la incarcarea cheilor API')
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    // Auth check
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/admin/login')
        } else {
          loadApiKeys()
        }
      })
  }, [router, loadApiKeys])

  const maskKey = (key: string): string => {
    if (key.length <= 12) return key
    return key.substring(0, 8) + '...' + key.substring(key.length - 4)
  }

  const copyKey = async (key: string, id: string) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = key
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) {
      setError('Numele este obligatoriu')
      return
    }

    setCreating(true)
    setError('')

    try {
      const permissions = allEndpoints ? [] : newPermissions
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({
          name: newName.trim(),
          rateLimitPerMinute: newRateLimit,
          permissions,
        }),
      })

      if (res.ok) {
        const apiKey = await res.json()
        setApiKeys(prev => [apiKey, ...prev])
        setShowCreateModal(false)
        resetCreateForm()
        showSuccess(`Cheia "${apiKey.name}" a fost creata. Copiaza cheia acum — nu va mai fi afisata integral.`)
      } else {
        const data = await res.json()
        setError(data.error || 'Eroare la creare')
      }
    } catch {
      setError('Eroare de conexiune')
    }
    setCreating(false)
  }

  const resetCreateForm = () => {
    setNewName('')
    setNewRateLimit(60)
    setNewPermissions([])
    setAllEndpoints(true)
    setError('')
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({ active: !currentActive }),
      })

      if (res.ok) {
        const updated = await res.json()
        setApiKeys(prev => prev.map(k => k.id === id ? updated : k))
        showSuccess(updated.active ? 'Cheia a fost activata' : 'Cheia a fost dezactivata')
      } else {
        const data = await res.json()
        setError(data.error || 'Eroare la actualizare')
      }
    } catch {
      setError('Eroare de conexiune')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': getCsrfToken(),
        },
      })

      if (res.ok) {
        setApiKeys(prev => prev.filter(k => k.id !== id))
        showSuccess('Cheia API a fost stearsa')
      } else {
        const data = await res.json()
        setError(data.error || 'Eroare la stergere')
      }
    } catch {
      setError('Eroare de conexiune')
    }
    setDeletingId(null)
  }

  const togglePermission = (perm: string) => {
    setNewPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    )
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Niciodata'
    const d = new Date(dateStr)
    return d.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl">Chei API</h1>
          <p className="text-sm text-gray-400">
            {apiKeys.length} cheie{apiKeys.length !== 1 ? ' API' : ' API'} configurata{apiKeys.length !== 1 ? 'e' : ''}
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true)
            resetCreateForm()
          }}
          className="px-4 py-2 bg-dinamo-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Cheie noua
        </button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* Error message */}
      {error && !showCreateModal && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* Empty state */}
      {apiKeys.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-4xl mb-3">
            <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">Nicio cheie API</h3>
          <p className="text-sm text-gray-500 mb-4">
            Creeaza o cheie API pentru a permite aplicatiilor externe sa acceseze datele clubului.
          </p>
          <button
            onClick={() => {
              setShowCreateModal(true)
              resetCreateForm()
            }}
            className="px-5 py-2.5 bg-dinamo-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
          >
            Creeaza prima cheie
          </button>
        </div>
      )}

      {/* API Keys Table */}
      {apiKeys.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nume</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Cheie</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Permisiuni</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Rate Limit</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Ultima utilizare</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 text-sm">{apiKey.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Creat: {formatDate(apiKey.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                          {maskKey(apiKey.key)}
                        </code>
                        <button
                          onClick={() => copyKey(apiKey.key, apiKey.id)}
                          className="p-1 text-gray-400 hover:text-dinamo-red transition-colors"
                          title="Copiaza cheia"
                        >
                          {copiedId === apiKey.id ? (
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {apiKey.permissions.length === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                          Toate
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {apiKey.permissions.map((p) => (
                            <span key={p} className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {apiKey.rateLimitPerMinute}/min
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(apiKey.lastUsedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(apiKey.id, apiKey.active)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          apiKey.active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            apiKey.active ? 'translate-x-[18px]' : 'translate-x-[2px]'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {deletingId === apiKey.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(apiKey.id)}
                            className="px-3 py-1 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                          >
                            Confirma
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                          >
                            Anuleaza
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(apiKey.id)}
                          className="px-3 py-1 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Sterge
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{apiKey.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Creat: {formatDate(apiKey.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => toggleActive(apiKey.id, apiKey.active)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                      apiKey.active ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        apiKey.active ? 'translate-x-[18px]' : 'translate-x-[2px]'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600 flex-1 truncate">
                    {maskKey(apiKey.key)}
                  </code>
                  <button
                    onClick={() => copyKey(apiKey.key, apiKey.id)}
                    className="p-1.5 text-gray-400 hover:text-dinamo-red transition-colors flex-shrink-0"
                  >
                    {copiedId === apiKey.id ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{apiKey.rateLimitPerMinute}/min</span>
                  <span>|</span>
                  <span>
                    {apiKey.permissions.length === 0
                      ? 'Toate endpoint-urile'
                      : apiKey.permissions.join(', ')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Ultima utilizare: {formatDate(apiKey.lastUsedAt)}
                  </span>
                  {deletingId === apiKey.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(apiKey.id)}
                        className="px-3 py-1 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                      >
                        Confirma
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        Anuleaza
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(apiKey.id)}
                      className="px-3 py-1 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Sterge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Documentation hint */}
      {apiKeys.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h3 className="font-heading font-bold text-sm text-gray-900 mb-3">Utilizare API</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Endpoint-urile disponibile:</p>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs space-y-1.5">
              <div><span className="text-green-600 font-bold">GET</span> /api/v1/teams</div>
              <div><span className="text-green-600 font-bold">GET</span> /api/v1/matches<span className="text-gray-400">?competitionId=...</span></div>
              <div><span className="text-green-600 font-bold">GET</span> /api/v1/calendar</div>
              <div><span className="text-green-600 font-bold">GET</span> /api/v1/standings/<span className="text-gray-400">{'{competitionId}'}</span></div>
              <div><span className="text-green-600 font-bold">GET</span> /api/v1/athletes</div>
            </div>
            <p className="mt-3">Autentificare: header <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">X-API-Key: drb_...</code> sau query param <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">?api_key=drb_...</code></p>
            <p>Paginare: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">?limit=50&offset=0</code> (max 100)</p>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !creating && setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg text-gray-900">
                Cheie API noua
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Cheia va fi generata automat cu prefixul drb_
              </p>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nume *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  placeholder="ex: Aplicatie mobila, Site extern"
                />
              </div>

              {/* Rate limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate limit (cereri/minut)
                </label>
                <input
                  type="number"
                  value={newRateLimit}
                  onChange={e => setNewRateLimit(Math.max(1, Math.min(1000, parseInt(e.target.value) || 60)))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  min={1}
                  max={1000}
                />
                <p className="text-xs text-gray-400 mt-1">Implicit: 60 cereri/minut. Maxim: 1000.</p>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permisiuni
                </label>

                {/* All endpoints toggle */}
                <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors bg-gray-50 border border-transparent hover:border-gray-200 mb-2">
                  <input
                    type="checkbox"
                    checked={allEndpoints}
                    onChange={() => {
                      setAllEndpoints(!allEndpoints)
                      if (!allEndpoints) {
                        setNewPermissions([])
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-dinamo-red focus:ring-dinamo-red"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">Toate endpoint-urile</div>
                    <div className="text-[11px] text-gray-400">Acces complet la toate datele publice</div>
                  </div>
                </label>

                {/* Individual endpoint checkboxes */}
                {!allEndpoints && (
                  <div className="space-y-1 ml-1">
                    {ENDPOINT_OPTIONS.map((ep) => (
                      <label
                        key={ep.value}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                          newPermissions.includes(ep.value)
                            ? 'bg-red-50/60 border border-red-200'
                            : 'bg-gray-50 border border-transparent hover:border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={newPermissions.includes(ep.value)}
                          onChange={() => togglePermission(ep.value)}
                          className="w-4 h-4 rounded border-gray-300 text-dinamo-red focus:ring-dinamo-red"
                        />
                        <span className="text-sm text-gray-700">{ep.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {error && showCreateModal && (
                <div className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Anuleaza
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || (!allEndpoints && newPermissions.length === 0)}
                className="flex-1 px-4 py-2.5 bg-dinamo-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {creating ? 'Se creeaza...' : 'Genereaza cheie'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
