'use client'

import { useState, useEffect, useCallback } from 'react'
import AttendanceForm from '@/components/sportiv/AttendanceForm'
import AttendanceStats from '@/components/sportiv/AttendanceStats'

interface Team {
  id: number
  grupa: string
}

interface Child {
  id: string
  name: string
}

export default function PrezentePage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState('antrenament')
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<{ date: string; present: number; total: number }[]>([])
  const [monthStats, setMonthStats] = useState({ total: 0, present: 0 })
  const [existingAttendance, setExistingAttendance] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/teams').then(r => r.json()).then(data => {
      const active = data.filter((t: Team & { active?: boolean }) => t.active !== false)
      setTeams(active)
      const stored = localStorage.getItem('prezente_team')
      if (stored && active.find((t: Team) => t.id === Number(stored))) {
        setSelectedTeam(Number(stored))
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedTeam) return
    localStorage.setItem('prezente_team', String(selectedTeam))
    fetch(`/api/admin/parinti`).then(r => r.json()).then(data => {
      if (!Array.isArray(data)) return
      const teamChildren: Child[] = []
      data.forEach((p: { children?: { id: string; name: string; teamId: number | null }[] }) => {
        p.children?.forEach(c => {
          if (c.teamId === selectedTeam) teamChildren.push({ id: c.id, name: c.name })
        })
      })
      teamChildren.sort((a, b) => a.name.localeCompare(b.name))
      setChildren(teamChildren)
    })
  }, [selectedTeam])

  const fetchExisting = useCallback(() => {
    if (!selectedTeam || !date) return
    fetch(`/api/admin/prezente?teamId=${selectedTeam}&date=${date}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const map: Record<string, boolean> = {}
          data.forEach((a: { child: { id: string }; present: boolean }) => {
            map[a.child.id] = a.present
          })
          setExistingAttendance(map)
        } else {
          setExistingAttendance({})
        }
      })
  }, [selectedTeam, date])

  useEffect(() => { fetchExisting() }, [fetchExisting])

  // Fetch history (last 7 days) and month stats
  useEffect(() => {
    if (!selectedTeam) return
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    fetch(`/api/admin/prezente?teamId=${selectedTeam}&month=${month}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        const total = data.length
        const present = data.filter((a: { present: boolean }) => a.present).length
        setMonthStats({ total, present })

        // Group by date for history
        const byDate: Record<string, { present: number; total: number }> = {}
        data.forEach((a: { date: string; present: boolean }) => {
          const d = new Date(a.date).toISOString().split('T')[0]
          if (!byDate[d]) byDate[d] = { present: 0, total: 0 }
          byDate[d].total++
          if (a.present) byDate[d].present++
        })
        const hist = Object.entries(byDate)
          .map(([date, stats]) => ({ date, ...stats }))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 7)
        setHistory(hist)
      })
  }, [selectedTeam, saved])

  const handleSave = async (attendances: { childId: string; present: boolean; notes: string }[]) => {
    const res = await fetch('/api/admin/prezente/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, type, teamId: selectedTeam, attendances }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      fetchExisting()
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-heading font-bold text-2xl mb-6">Prezente</h1>

      {/* Team selector - pill buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {teams.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTeam(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedTeam === t.id
                ? 'bg-dinamo-red text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.grupa}
          </button>
        ))}
      </div>

      {selectedTeam && (
        <>
          {/* Date + type */}
          <div className="flex gap-3 mb-4">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <select value={type} onChange={e => setType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
              <option value="antrenament">Antrenament</option>
              <option value="meci">Meci</option>
              <option value="turneu">Turneu</option>
            </select>
          </div>

          {saved && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4 text-center font-medium">
              Prezenta salvata cu succes!
            </div>
          )}

          {children.length > 0 ? (
            <AttendanceForm
              players={children}
              onSave={handleSave}
              initialAttendances={Object.keys(existingAttendance).length > 0 ? existingAttendance : undefined}
            />
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Nu exista copii in aceasta echipa.</p>
          )}

          {/* Month stats */}
          {monthStats.total > 0 && (
            <div className="mt-8 bg-white rounded-lg border p-4">
              <h3 className="font-medium text-sm mb-3">Statistici luna curenta</h3>
              <AttendanceStats total={monthStats.total} present={monthStats.present} />
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="mt-6 bg-white rounded-lg border p-4">
              <h3 className="font-medium text-sm mb-3">Istoric recent</h3>
              <div className="space-y-1">
                {history.map(h => (
                  <div key={h.date} className="flex items-center justify-between text-sm py-1">
                    <span className="text-gray-600">{new Date(h.date).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <span className="font-medium">{h.present}/{h.total} prezenti</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
