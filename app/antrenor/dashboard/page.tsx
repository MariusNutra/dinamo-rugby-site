'use client'

import { useEffect, useState } from 'react'

interface CoachProfile {
  name: string
  teamName: string | null
  teamColor: string | null
}

interface TeamInfo {
  id: number
  grupa: string
  color: string
  ageRange: string | null
  schedule: string | null
  playerCount: number
}

interface ScheduleEvent {
  id: string
  title: string
  type: string
  date: string
  startTime: string | null
  endTime: string | null
  location: string | null
}

interface Player {
  id: string
  name: string
  birthYear: number
  attendanceToday: string
}

interface MatchItem {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  date: string
  time: string
  location: string | null
  status: string
  competitionName: string | null
}

interface AttendancePlayer {
  childId: string
  name: string
  status: 'present' | 'absent' | 'unmarked'
}

export default function DashboardAntrenorPage() {
  const [profile, setProfile] = useState<CoachProfile | null>(null)
  const [team, setTeam] = useState<TeamInfo | null | undefined>(undefined)
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [loading, setLoading] = useState(true)

  // Attendance management
  const [attDate, setAttDate] = useState(() => new Date().toISOString().split('T')[0])
  const [attPlayers, setAttPlayers] = useState<AttendancePlayer[]>([])
  const [attLoading, setAttLoading] = useState(false)
  const [attSaving, setAttSaving] = useState(false)
  const [attSaved, setAttSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/antrenor/me').then(r => r.json()),
      fetch('/api/antrenor/team').then(r => r.json()),
      fetch('/api/antrenor/schedule').then(r => r.json()),
      fetch('/api/antrenor/players').then(r => r.json()),
      fetch('/api/antrenor/matches').then(r => r.json()),
    ]).then(([me, teamData, sched, pl, ma]) => {
      setProfile(me)
      setTeam(teamData.team ?? null)
      setSchedule(sched.data || [])
      setPlayers(pl.data || [])
      setMatches(ma.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Load attendance for selected date
  useEffect(() => {
    if (team === null || team === undefined) return
    setAttLoading(true)
    setAttSaved(false)
    fetch(`/api/antrenor/attendance?date=${attDate}`)
      .then(r => r.json())
      .then(data => {
        setAttPlayers(data.players || [])
        setAttLoading(false)
      })
      .catch(() => setAttLoading(false))
  }, [attDate, team])

  const toggleAttendance = (childId: string) => {
    setAttSaved(false)
    setAttPlayers(prev => prev.map(p => {
      if (p.childId !== childId) return p
      const next = p.status === 'unmarked' ? 'present' : p.status === 'present' ? 'absent' : 'present'
      return { ...p, status: next as AttendancePlayer['status'] }
    }))
  }

  const saveAttendance = async () => {
    setAttSaving(true)
    const marked = attPlayers.filter(p => p.status !== 'unmarked')
    await fetch('/api/antrenor/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: attDate,
        attendances: marked.map(p => ({ childId: p.childId, present: p.status === 'present' })),
      }),
    })
    setAttSaving(false)
    setAttSaved(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const upcomingMatches = matches.filter(m => m.status === 'scheduled').slice(0, 5)
  const recentMatches = matches.filter(m => m.status === 'finished').slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-dinamo-blue to-blue-800 text-white rounded-lg p-6">
        <h1 className="font-heading text-2xl font-bold mb-1">
          Bine ai venit, {profile?.name}!
        </h1>
        {team ? (
          <p className="text-blue-200">Echipa: <strong className="text-white">{team.grupa}</strong>
            {team.ageRange && <span className="ml-2 text-blue-300">({team.ageRange})</span>}
          </p>
        ) : (
          <p className="text-blue-200">Nu esti asignat la o echipa momentan. Contacteaza un administrator.</p>
        )}
      </div>

      {team && (
        <>
          {/* Team Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-dinamo-blue">{team.playerCount}</div>
              <div className="text-sm text-gray-500">Sportivi</div>
            </div>
            <div className="bg-white rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-dinamo-blue">{schedule.length}</div>
              <div className="text-sm text-gray-500">Evenimente</div>
            </div>
            <div className="bg-white rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-dinamo-blue">{matches.length}</div>
              <div className="text-sm text-gray-500">Meciuri</div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-lg border">
            <div className="px-4 py-3 border-b">
              <h2 className="font-heading font-bold text-lg text-gray-900">Program</h2>
            </div>
            <div className="p-4">
              {schedule.length === 0 ? (
                <p className="text-gray-500 text-sm">Niciun eveniment programat.</p>
              ) : (
                <div className="space-y-3">
                  {schedule.slice(0, 5).map(ev => (
                    <div key={ev.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                      <div className="text-center min-w-[60px]">
                        <div className="text-xs text-gray-500 uppercase">{formatDate(ev.date)}</div>
                        {ev.startTime && <div className="text-sm font-bold text-dinamo-blue">{ev.startTime}</div>}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{ev.title}</div>
                        <div className="text-sm text-gray-500">
                          {ev.location && <span>{ev.location}</span>}
                          {ev.endTime && <span className="ml-2">pana la {ev.endTime}</span>}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ev.type === 'training' ? 'bg-green-100 text-green-700' :
                        ev.type === 'match' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {ev.type === 'training' ? 'Antrenament' : ev.type === 'match' ? 'Meci' : ev.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Players */}
          <div className="bg-white rounded-lg border">
            <div className="px-4 py-3 border-b">
              <h2 className="font-heading font-bold text-lg text-gray-900">
                Sportivi ({players.length})
              </h2>
            </div>
            <div className="p-4">
              {players.length === 0 ? (
                <p className="text-gray-500 text-sm">Niciun sportiv in echipa.</p>
              ) : (
                <div className="space-y-2">
                  {players.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <span className="font-medium text-gray-900">{p.name}</span>
                        <span className="text-xs text-gray-400 ml-2">({p.birthYear})</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        p.attendanceToday === 'present' ? 'bg-green-100 text-green-700' :
                        p.attendanceToday === 'absent' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {p.attendanceToday === 'present' ? 'Prezent' :
                         p.attendanceToday === 'absent' ? 'Absent' : 'Nemarcat'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attendance Management */}
          <div className="bg-white rounded-lg border">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-heading font-bold text-lg text-gray-900">Gestionare Prezenta</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm font-medium text-gray-700">Data:</label>
                <input
                  type="date"
                  value={attDate}
                  onChange={e => setAttDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none"
                />
              </div>

              {attLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin w-6 h-6 border-3 border-dinamo-red border-t-transparent rounded-full"></div>
                </div>
              ) : attPlayers.length === 0 ? (
                <p className="text-gray-500 text-sm">Niciun sportiv in echipa.</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {attPlayers.map(p => (
                      <div key={p.childId} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="font-medium text-gray-900">{p.name}</span>
                        <button
                          onClick={() => toggleAttendance(p.childId)}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                            p.status === 'present'
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : p.status === 'absent'
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {p.status === 'present' ? 'Prezent' :
                           p.status === 'absent' ? 'Absent' : 'Nemarcat'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={saveAttendance}
                      disabled={attSaving}
                      className="bg-dinamo-red text-white px-6 py-2 rounded-lg font-heading font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {attSaving ? 'Se salveaza...' : 'Salveaza prezenta'}
                    </button>
                    {attSaved && (
                      <span className="text-green-600 text-sm font-medium">Salvat!</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Matches */}
          <div className="bg-white rounded-lg border">
            <div className="px-4 py-3 border-b">
              <h2 className="font-heading font-bold text-lg text-gray-900">Meciuri</h2>
            </div>
            <div className="p-4">
              {matches.length === 0 ? (
                <p className="text-gray-500 text-sm">Niciun meci programat.</p>
              ) : (
                <div className="space-y-4">
                  {upcomingMatches.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase">Urmatoare</h3>
                      {upcomingMatches.map(m => (
                        <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {m.homeTeam} vs {m.awayTeam}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(m.date)} {m.time && `| ${m.time}`}
                              {m.location && ` | ${m.location}`}
                            </div>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Programat</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {recentMatches.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase">Rezultate</h3>
                      {recentMatches.map(m => (
                        <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {m.homeTeam} vs {m.awayTeam}
                            </div>
                            <div className="text-xs text-gray-500">{formatDate(m.date)}</div>
                          </div>
                          <span className="font-bold text-dinamo-blue">
                            {m.homeScore !== null ? `${m.homeScore} - ${m.awayScore}` : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
