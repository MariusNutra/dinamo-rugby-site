'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCsrfToken } from '@/lib/csrf-client'

interface Team {
  id: number
  grupa: string
  color: string
}

interface TacticalBoard {
  id: string
  name: string
  formation: string
  notes: string | null
  teamId: number | null
  team: Team | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

interface PlayerPos {
  x: number
  y: number
}

// Mini preview: parse formation and render tiny SVG
function MiniFieldPreview({ formation }: { formation: string }) {
  let players: Record<string, PlayerPos> = {}
  try {
    const parsed = JSON.parse(formation)
    if (parsed.attack) players = parsed.attack
    else if (typeof parsed === 'object') players = parsed
  } catch {
    // empty
  }

  const playerKeys = Object.keys(players)

  return (
    <svg viewBox="0 0 700 400" className="w-full h-full" style={{ background: '#2d8a4e' }}>
      {/* Field lines */}
      <rect x="10" y="10" width="680" height="380" fill="none" stroke="white" strokeWidth="2" rx="4" />
      <line x1="350" y1="10" x2="350" y2="390" stroke="white" strokeWidth="1.5" strokeDasharray="6,4" />
      <line x1="165" y1="10" x2="165" y2="390" stroke="white" strokeWidth="1" opacity="0.6" />
      <line x1="535" y1="10" x2="535" y2="390" stroke="white" strokeWidth="1" opacity="0.6" />
      {/* Players */}
      {playerKeys.map(key => {
        const p = players[key]
        if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') return null
        return (
          <circle key={key} cx={p.x} cy={p.y} r={8} fill="#D0021B" stroke="white" strokeWidth="1.5" />
        )
      })}
    </svg>
  )
}

export default function TacticalBoardsPage() {
  const [boards, setBoards] = useState<TacticalBoard[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTeamId, setNewTeamId] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const router = useRouter()

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadBoards = () => {
    fetch('/api/admin/tactical')
      .then(r => r.json())
      .then(data => {
        setBoards(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const loadTeams = () => {
    fetch('/api/teams')
      .then(r => r.json())
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => {})
  }

  useEffect(() => {
    loadBoards()
    loadTeams()
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) {
      showToast('Introdu un nume pentru tabla tactica', 'err')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/tactical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({
          name: newName.trim(),
          teamId: newTeamId ? Number(newTeamId) : null,
        }),
      })

      if (res.ok) {
        const board = await res.json()
        router.push(`/admin/tactical/${board.id}`)
      } else {
        const err = await res.json().catch(() => ({}))
        showToast(err.error || 'Eroare la creare', 'err')
      }
    } catch {
      showToast('Eroare de retea', 'err')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Sterge aceasta tabla tactica?')) return

    try {
      const res = await fetch(`/api/admin/tactical/${id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': getCsrfToken() },
      })
      if (res.ok) {
        showToast('Tabla tactica stearsa')
        loadBoards()
      } else {
        showToast('Eroare la stergere', 'err')
      }
    } catch {
      showToast('Eroare de retea', 'err')
    }
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-dinamo-blue">
          Tabla Tactica
        </h1>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
        >
          + Tabla noua
        </button>
      </div>

      {/* Create new board dialog */}
      {creating && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="font-heading font-bold text-lg text-dinamo-blue mb-4">
            Tabla tactica noua
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nume</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="ex: Formatie atac U14"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Echipa (optional)</label>
              <select
                value={newTeamId}
                onChange={e => setNewTeamId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red"
              >
                <option value="">-- Fara echipa --</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.grupa}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-6 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? 'Se creaza...' : 'Creaza si editeaza'}
              </button>
              <button
                onClick={() => {
                  setCreating(false)
                  setNewName('')
                  setNewTeamId('')
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Anuleaza
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boards grid */}
      {boards.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <p className="text-gray-500 mb-2">Nicio tabla tactica creata</p>
          <p className="text-gray-400 text-sm">Apasa &quot;+ Tabla noua&quot; pentru a incepe</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map(board => (
            <div
              key={board.id}
              onClick={() => router.push(`/admin/tactical/${board.id}`)}
              className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
            >
              {/* Mini field preview */}
              <div className="h-40 overflow-hidden">
                <MiniFieldPreview formation={board.formation} />
              </div>
              <div className="p-4">
                <h3 className="font-heading font-bold text-sm text-dinamo-blue group-hover:text-dinamo-red transition-colors truncate">
                  {board.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {board.team && (
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-dinamo-blue/10 text-dinamo-blue font-medium">
                      {board.team.grupa}
                    </span>
                  )}
                </div>
                {board.notes && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{board.notes}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">
                    {new Date(board.updatedAt).toLocaleDateString('ro-RO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <button
                    onClick={e => handleDelete(board.id, e)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Sterge"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium z-50 ${
            toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
