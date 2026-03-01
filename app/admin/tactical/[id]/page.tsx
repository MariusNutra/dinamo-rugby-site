'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCsrfToken } from '@/lib/csrf-client'

interface Team {
  id: number
  grupa: string
  color: string
}

interface PlayerPos {
  x: number
  y: number
}

interface Formation {
  attack: Record<string, PlayerPos>
  defense: Record<string, PlayerPos>
}

// Standard rugby union positions (15-a-side) with default formation layout
const RUGBY_POSITIONS: Record<string, { label: string; defaultAttack: PlayerPos; defaultDefense: PlayerPos }> = {
  '1':  { label: 'Pilier stânga',              defaultAttack: { x: 230, y: 170 }, defaultDefense: { x: 470, y: 170 } },
  '2':  { label: 'Trocar (Taloneur)',          defaultAttack: { x: 230, y: 200 }, defaultDefense: { x: 470, y: 200 } },
  '3':  { label: 'Pilier dreapta',             defaultAttack: { x: 230, y: 230 }, defaultDefense: { x: 470, y: 230 } },
  '4':  { label: 'Linia a II-a stânga',        defaultAttack: { x: 210, y: 165 }, defaultDefense: { x: 490, y: 165 } },
  '5':  { label: 'Linia a II-a dreapta',       defaultAttack: { x: 210, y: 235 }, defaultDefense: { x: 490, y: 235 } },
  '6':  { label: 'Aripă de grămadă stânga',    defaultAttack: { x: 250, y: 140 }, defaultDefense: { x: 450, y: 140 } },
  '7':  { label: 'Aripă de grămadă dreapta',   defaultAttack: { x: 250, y: 260 }, defaultDefense: { x: 450, y: 260 } },
  '8':  { label: 'Închizător',                  defaultAttack: { x: 200, y: 200 }, defaultDefense: { x: 500, y: 200 } },
  '9':  { label: 'Mijlocaș la grămadă',        defaultAttack: { x: 280, y: 200 }, defaultDefense: { x: 420, y: 200 } },
  '10': { label: 'Deschizător',                defaultAttack: { x: 320, y: 200 }, defaultDefense: { x: 380, y: 200 } },
  '11': { label: 'Aripă stânga',               defaultAttack: { x: 400, y: 40  }, defaultDefense: { x: 300, y: 40  } },
  '12': { label: 'Centru interior',             defaultAttack: { x: 370, y: 160 }, defaultDefense: { x: 330, y: 160 } },
  '13': { label: 'Centru exterior',             defaultAttack: { x: 400, y: 240 }, defaultDefense: { x: 300, y: 240 } },
  '14': { label: 'Aripă dreapta',              defaultAttack: { x: 400, y: 360 }, defaultDefense: { x: 300, y: 360 } },
  '15': { label: 'Fundaș',                     defaultAttack: { x: 480, y: 200 }, defaultDefense: { x: 220, y: 200 } },
}

function getDefaultFormation(): Formation {
  const attack: Record<string, PlayerPos> = {}
  const defense: Record<string, PlayerPos> = {}
  for (const [num, pos] of Object.entries(RUGBY_POSITIONS)) {
    attack[num] = { ...pos.defaultAttack }
    defense[num] = { ...pos.defaultDefense }
  }
  return { attack, defense }
}

export default function TacticalBoardEditorPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = params.id as string

  const [name, setName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [formation, setFormation] = useState<Formation>(getDefaultFormation())
  const [notes, setNotes] = useState('')
  const [teamId, setTeamId] = useState<string>('')
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [activeLayer, setActiveLayer] = useState<'attack' | 'defense'>('attack')
  const [dragging, setDragging] = useState<string | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    fetch('/api/teams')
      .then(r => r.json())
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`/api/admin/tactical/${boardId}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(data => {
        setName(data.name || '')
        setNotes(data.notes || '')
        setTeamId(data.teamId ? String(data.teamId) : '')

        // Parse formation
        try {
          const parsed = JSON.parse(data.formation)
          if (parsed.attack && parsed.defense) {
            // Merge with defaults to ensure all 15 players exist
            const defaults = getDefaultFormation()
            const attack: Record<string, PlayerPos> = { ...defaults.attack }
            const defense: Record<string, PlayerPos> = { ...defaults.defense }
            for (const [k, v] of Object.entries(parsed.attack as Record<string, PlayerPos>)) {
              if (v && typeof v.x === 'number' && typeof v.y === 'number') {
                attack[k] = v
              }
            }
            for (const [k, v] of Object.entries(parsed.defense as Record<string, PlayerPos>)) {
              if (v && typeof v.x === 'number' && typeof v.y === 'number') {
                defense[k] = v
              }
            }
            setFormation({ attack, defense })
          } else {
            // Legacy format: just attack positions
            const defaults = getDefaultFormation()
            const attack: Record<string, PlayerPos> = { ...defaults.attack }
            for (const [k, v] of Object.entries(parsed as Record<string, PlayerPos>)) {
              if (v && typeof v.x === 'number' && typeof v.y === 'number') {
                attack[k] = v
              }
            }
            setFormation({ attack, defense: defaults.defense })
          }
        } catch {
          setFormation(getDefaultFormation())
        }

        setLoading(false)
      })
      .catch(() => {
        showToast('Tabla tactica negasita', 'err')
        setLoading(false)
      })
  }, [boardId])

  const getSVGPoint = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const svg = svgRef.current
    if (!svg) return null
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const svgPt = pt.matrixTransform(ctm.inverse())
    return { x: Math.round(svgPt.x), y: Math.round(svgPt.y) }
  }, [])

  const handleMouseDown = useCallback((playerNum: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(playerNum)
    setSelectedPlayer(playerNum)
  }, [])

  const handleTouchStart = useCallback((playerNum: string, e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(playerNum)
    setSelectedPlayer(playerNum)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const pt = getSVGPoint(e.clientX, e.clientY)
    if (!pt) return
    // Clamp to field bounds
    const x = Math.max(15, Math.min(685, pt.x))
    const y = Math.max(15, Math.min(385, pt.y))
    setFormation(prev => ({
      ...prev,
      [activeLayer]: {
        ...prev[activeLayer],
        [dragging]: { x, y },
      },
    }))
  }, [dragging, activeLayer, getSVGPoint])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return
    const touch = e.touches[0]
    if (!touch) return
    const pt = getSVGPoint(touch.clientX, touch.clientY)
    if (!pt) return
    const x = Math.max(15, Math.min(685, pt.x))
    const y = Math.max(15, Math.min(385, pt.y))
    setFormation(prev => ({
      ...prev,
      [activeLayer]: {
        ...prev[activeLayer],
        [dragging]: { x, y },
      },
    }))
  }, [dragging, activeLayer, getSVGPoint])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/tactical/${boardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({
          name,
          formation: JSON.stringify(formation),
          notes: notes || null,
          teamId: teamId ? Number(teamId) : null,
        }),
      })

      if (res.ok) {
        showToast('Salvat cu succes')
      } else {
        const err = await res.json().catch(() => ({}))
        showToast(err.error || 'Eroare la salvare', 'err')
      }
    } catch {
      showToast('Eroare de retea', 'err')
    } finally {
      setSaving(false)
    }
  }

  const handleResetFormation = () => {
    if (!confirm('Reseteaza formatia la pozitiile implicite?')) return
    setFormation(getDefaultFormation())
  }

  const handleDelete = async () => {
    if (!confirm('Esti sigur ca vrei sa stergi aceasta tabla tactica? Actiunea este ireversibila.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/tactical/${boardId}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': getCsrfToken() },
      })
      if (res.ok) {
        router.push('/admin/tactical')
      } else {
        showToast('Eroare la stergere', 'err')
        setDeleting(false)
      }
    } catch {
      showToast('Eroare de retea', 'err')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const currentPlayers = formation[activeLayer]
  const attackColor = '#D0021B'
  const defenseColor = '#1a6ee0'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tactical"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-dinamo-blue">
            Editor Tabla Tactica
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
            title="Sterge tabla tactica"
          >
            {deleting ? 'Se sterge...' : 'Sterge'}
          </button>
          <button
            onClick={handleResetFormation}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Reseteaza pozitii
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50"
          >
            {saving ? 'Se salveaza...' : 'Salveaza'}
          </button>
        </div>
      </div>

      {/* Board name and team */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume tabla</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Echipa</label>
            <select
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red"
            >
              <option value="">-- Fara echipa --</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.grupa}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Layer toggle */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Echipa afisata:</span>
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setActiveLayer('attack')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeLayer === 'attack'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Atac (rosu)
            </button>
            <button
              onClick={() => setActiveLayer('defense')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeLayer === 'defense'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Aparare (albastru)
            </button>
          </div>
          {selectedPlayer && RUGBY_POSITIONS[selectedPlayer] && (
            <span className="text-sm text-gray-500">
              #{selectedPlayer} - {RUGBY_POSITIONS[selectedPlayer].label}
            </span>
          )}
        </div>
      </div>

      {/* SVG Field */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="w-full overflow-x-auto">
          <svg
            ref={svgRef}
            viewBox="0 0 700 400"
            className="w-full max-w-4xl mx-auto select-none"
            style={{ touchAction: 'none', minWidth: '500px' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {/* Field background */}
            <rect x="0" y="0" width="700" height="400" fill="#2d8a4e" rx="8" />

            {/* In-goal areas */}
            <rect x="10" y="10" width="50" height="380" fill="#247040" stroke="white" strokeWidth="2" />
            <rect x="640" y="10" width="50" height="380" fill="#247040" stroke="white" strokeWidth="2" />

            {/* Field outline */}
            <rect x="60" y="10" width="580" height="380" fill="none" stroke="white" strokeWidth="2" />

            {/* Halfway line */}
            <line x1="350" y1="10" x2="350" y2="390" stroke="white" strokeWidth="2" />

            {/* 22m lines */}
            <line x1="185" y1="10" x2="185" y2="390" stroke="white" strokeWidth="1.5" strokeDasharray="8,4" />
            <line x1="515" y1="10" x2="515" y2="390" stroke="white" strokeWidth="1.5" strokeDasharray="8,4" />

            {/* 10m lines (from halfway) */}
            <line x1="290" y1="10" x2="290" y2="390" stroke="white" strokeWidth="1" opacity="0.4" />
            <line x1="410" y1="10" x2="410" y2="390" stroke="white" strokeWidth="1" opacity="0.4" />

            {/* 5m lines (from touchlines) */}
            <line x1="60" y1="35" x2="640" y2="35" stroke="white" strokeWidth="0.5" opacity="0.3" />
            <line x1="60" y1="365" x2="640" y2="365" stroke="white" strokeWidth="0.5" opacity="0.3" />

            {/* Center circle */}
            <circle cx="350" cy="200" r="30" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />

            {/* Field labels */}
            <text x="35" y="205" textAnchor="middle" fill="white" fontSize="10" opacity="0.5" transform="rotate(-90, 35, 205)">IN-GOAL</text>
            <text x="665" y="205" textAnchor="middle" fill="white" fontSize="10" opacity="0.5" transform="rotate(90, 665, 205)">IN-GOAL</text>
            <text x="185" y="398" textAnchor="middle" fill="white" fontSize="9" opacity="0.4">22m</text>
            <text x="515" y="398" textAnchor="middle" fill="white" fontSize="9" opacity="0.4">22m</text>
            <text x="350" y="398" textAnchor="middle" fill="white" fontSize="9" opacity="0.4">50m</text>

            {/* Inactive layer players (dimmed) */}
            {Object.entries(formation[activeLayer === 'attack' ? 'defense' : 'attack']).map(([num, pos]) => {
              if (!pos || typeof pos.x !== 'number') return null
              const inactiveColor = activeLayer === 'attack' ? defenseColor : attackColor
              return (
                <g key={`inactive-${num}`} opacity="0.3">
                  <circle cx={pos.x} cy={pos.y} r={12} fill={inactiveColor} stroke="white" strokeWidth="1" />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" style={{ pointerEvents: 'none' }}>
                    {num}
                  </text>
                </g>
              )
            })}

            {/* Active layer players (draggable) */}
            {Object.entries(currentPlayers).map(([num, pos]) => {
              if (!pos || typeof pos.x !== 'number') return null
              const isActive = dragging === num
              const isSelected = selectedPlayer === num
              const color = activeLayer === 'attack' ? attackColor : defenseColor
              return (
                <g
                  key={`active-${num}`}
                  style={{ cursor: isActive ? 'grabbing' : 'grab' }}
                  onMouseDown={e => handleMouseDown(num, e)}
                  onTouchStart={e => handleTouchStart(num, e)}
                >
                  {/* Selection ring */}
                  {isSelected && (
                    <circle cx={pos.x} cy={pos.y} r={17} fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
                  )}
                  {/* Shadow */}
                  <circle cx={pos.x + 1} cy={pos.y + 2} r={12} fill="rgba(0,0,0,0.3)" />
                  {/* Player circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={12}
                    fill={color}
                    stroke="white"
                    strokeWidth={isActive ? 3 : 2}
                  />
                  {/* Jersey number */}
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {num}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Trage jucatorii pentru a-i pozitiona pe teren. Comuta intre Atac si Aparare pentru a muta ambele echipe.
        </p>
      </div>

      {/* Player position legend */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="font-heading font-bold text-sm text-dinamo-blue mb-3">
          Legendă poziții ({activeLayer === 'attack' ? 'Atac' : 'Apărare'})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {Object.entries(RUGBY_POSITIONS).map(([num, pos]) => {
            const isForwards = Number(num) <= 8
            return (
              <button
                key={num}
                onClick={() => setSelectedPlayer(num)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                  selectedPlayer === num
                    ? 'bg-dinamo-blue text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: activeLayer === 'attack' ? attackColor : defenseColor }}
                >
                  {num}
                </span>
                <span className="truncate">
                  {pos.label}
                  {isForwards ? '' : ''}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-400 inline-block"></span>
            #1-8: Înaintarea (Pachet)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span>
            #9-15: Linia de trei-sferturi
          </span>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <label className="block font-heading font-bold text-sm text-dinamo-blue mb-2">
          Note
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Adauga note despre aceasta formatie..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red"
        />
      </div>

      {/* Bottom save bar */}
      <div className="flex justify-end gap-3 mb-8">
        <Link
          href="/admin/tactical"
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          Inapoi la lista
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50"
        >
          {saving ? 'Se salveaza...' : 'Salveaza modificarile'}
        </button>
      </div>

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
