'use client'

import { useEffect, useState, useCallback } from 'react'

interface Team {
  id: number
  grupa: string
}

interface Athlete {
  id: string
  name: string
  birthYear: number
  teamId: number | null
  teamGrupa: string | null
  medicalCert: boolean
  photoConsent: boolean
}

interface Competition {
  id: string
  name: string
  type: string
  season: string | null
  category: string | null
  active: boolean
  teams: {
    id: string
    teamName: string
    points: number
    played: number
    won: number
    drawn: number
    lost: number
    goalsFor: number
    goalsAgainst: number
  }[]
  teamCount: number
  matchCount: number
}

interface AttendanceRecord {
  id: string
  childId: string
  date: string
  present: boolean
  type: string
  child: { id: string; name: string }
}

export default function AdminFederatiePage() {
  // Athletes state
  const [teams, setTeams] = useState<Team[]>([])
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [athleteTeamFilter, setAthleteTeamFilter] = useState<string>('')
  const [loadingAthletes, setLoadingAthletes] = useState(true)

  // Competitions state
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedCompetition, setSelectedCompetition] = useState<string>('')
  const [selectedCompData, setSelectedCompData] = useState<Competition | null>(null)
  const [loadingCompetitions, setLoadingCompetitions] = useState(true)

  // Attendance state
  const [attendanceFrom, setAttendanceFrom] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [attendanceTo, setAttendanceTo] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [attendanceTeamFilter, setAttendanceTeamFilter] = useState<string>('')
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  // Exporting state
  const [exporting, setExporting] = useState<string | null>(null)

  // Load teams
  useEffect(() => {
    fetch('/api/teams')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTeams(data.filter((t: Team & { active?: boolean }) => t.active !== false))
        }
      })
      .catch(() => {})
  }, [])

  // Load athletes from parents API (same pattern as sportivi page)
  useEffect(() => {
    setLoadingAthletes(true)
    fetch('/api/admin/parinti')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        const all: Athlete[] = []
        data.forEach((p: {
          children?: {
            id: string
            name: string
            birthYear: number
            teamId: number | null
            teamName?: string | null
            photoConsent?: boolean
          }[]
        }) => {
          p.children?.forEach(c => {
            all.push({
              id: c.id,
              name: c.name,
              birthYear: c.birthYear,
              teamId: c.teamId,
              teamGrupa: c.teamName || null,
              medicalCert: false, // not included in parinti API response
              photoConsent: c.photoConsent || false,
            })
          })
        })
        all.sort((a, b) => a.name.localeCompare(b.name))
        setAthletes(all)
      })
      .catch(() => {})
      .finally(() => setLoadingAthletes(false))
  }, [])

  // Load competitions
  useEffect(() => {
    setLoadingCompetitions(true)
    fetch('/api/admin/competitions')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCompetitions(data)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCompetitions(false))
  }, [])

  // Load competition details when selected
  useEffect(() => {
    if (!selectedCompetition) {
      setSelectedCompData(null)
      return
    }
    fetch(`/api/admin/competitions/${selectedCompetition}`)
      .then(r => r.json())
      .then(data => setSelectedCompData(data))
      .catch(() => setSelectedCompData(null))
  }, [selectedCompetition])

  // Load attendance summary for date range
  const loadAttendance = useCallback(() => {
    if (!attendanceFrom || !attendanceTo) return
    setLoadingAttendance(true)

    // Build query using the existing prezente API with date range
    const fromDate = attendanceFrom
    const toDate = attendanceTo

    // The prezente API supports month param but not arbitrary range
    // We'll fetch all and filter, or use multiple months
    // Simplest: fetch with a broad month range and filter client-side
    const params = new URLSearchParams()
    if (attendanceTeamFilter) params.set('teamId', attendanceTeamFilter)

    // Use the from month for the API call and fetch all in range
    const startMonth = attendanceFrom.slice(0, 7) // YYYY-MM
    params.set('month', startMonth)

    // For simplicity, we make one call per month in the range
    const start = new Date(attendanceFrom)
    const end = new Date(attendanceTo)
    const months: string[] = []
    const curr = new Date(start.getFullYear(), start.getMonth(), 1)
    while (curr <= end) {
      const y = curr.getFullYear()
      const m = String(curr.getMonth() + 1).padStart(2, '0')
      months.push(`${y}-${m}`)
      curr.setMonth(curr.getMonth() + 1)
    }

    const promises = months.map(month => {
      const p = new URLSearchParams()
      if (attendanceTeamFilter) p.set('teamId', attendanceTeamFilter)
      p.set('month', month)
      return fetch(`/api/admin/prezente?${p.toString()}`)
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
    })

    Promise.all(promises)
      .then(results => {
        const allRecords: AttendanceRecord[] = results.flat()
        // Filter to exact date range
        const fromTime = new Date(fromDate + 'T00:00:00').getTime()
        const toTime = new Date(toDate + 'T23:59:59').getTime()
        const filtered = allRecords.filter(r => {
          const t = new Date(r.date).getTime()
          return t >= fromTime && t <= toTime
        })
        setAttendanceRecords(filtered)
      })
      .catch(() => setAttendanceRecords([]))
      .finally(() => setLoadingAttendance(false))
  }, [attendanceFrom, attendanceTo, attendanceTeamFilter])

  useEffect(() => {
    loadAttendance()
  }, [loadAttendance])

  // Computed attendance summary
  const attendanceSummary = (() => {
    const totalRecords = attendanceRecords.length
    const presentCount = attendanceRecords.filter(r => r.present).length
    // Unique sessions = unique dates
    const uniqueDates = new Set(attendanceRecords.map(r => r.date.split('T')[0]))
    return {
      totalRecords,
      presentCount,
      uniqueSessions: uniqueDates.size,
    }
  })()

  // Filtered athletes
  const filteredAthletes = athletes.filter(a => {
    if (athleteTeamFilter && a.teamId !== Number(athleteTeamFilter)) return false
    return true
  })

  // Team breakdown
  const teamBreakdown = teams.map(t => ({
    ...t,
    count: athletes.filter(a => a.teamId === t.id).length,
  }))

  // Download helper
  const downloadExport = async (exportType: string, params: Record<string, string> = {}) => {
    setExporting(exportType)
    try {
      const searchParams = new URLSearchParams({ type: exportType, ...params })
      const res = await fetch(`/api/admin/export/federatie?${searchParams.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Eroare necunoscuta' }))
        alert(err.error || 'Eroare la export')
        return
      }

      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') || ''
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/)
      const filename = filenameMatch ? filenameMatch[1] : `export-federatie.${exportType.includes('xml') ? 'xml' : 'csv'}`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Eroare la descarcare')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl">Federatie - FRR</h1>
        <p className="text-gray-500 text-sm mt-1">Export date pentru Federatia Romana de Rugby</p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Sportivi Legitimati */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-heading font-bold text-lg">Sportivi Legitimati</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Lista sportivilor inregistrati pentru raportare FRR
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={athleteTeamFilter}
                onChange={e => setAthleteTeamFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
              >
                <option value="">Toate echipele</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.grupa}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-dinamo-red">{athletes.length}</div>
              <div className="text-xs text-gray-500">Total sportivi</div>
            </div>
            {teamBreakdown.slice(0, 3).map(t => (
              <div key={t.id} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-dinamo-blue">{t.count}</div>
                <div className="text-xs text-gray-500">{t.grupa}</div>
              </div>
            ))}
          </div>

          {teamBreakdown.length > 3 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {teamBreakdown.slice(3).map(t => (
                <div key={t.id} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-dinamo-blue">{t.count}</div>
                  <div className="text-xs text-gray-500">{t.grupa}</div>
                </div>
              ))}
            </div>
          )}

          {/* Preview table */}
          {loadingAthletes ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-xs text-gray-500 uppercase">
                      <th className="px-3 py-2 text-left">Nume</th>
                      <th className="px-3 py-2 text-center">An nastere</th>
                      <th className="px-3 py-2 text-center">Grupa</th>
                      <th className="px-3 py-2 text-center">Cert. Medical</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAthletes.slice(0, 10).map(a => (
                      <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-medium">{a.name}</td>
                        <td className="px-3 py-2.5 text-center text-gray-600">{a.birthYear}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {a.teamGrupa || 'Fara'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {a.medicalCert ? (
                            <span className="text-green-600 text-xs font-bold">Da</span>
                          ) : (
                            <span className="text-red-500 text-xs font-bold">Nu</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredAthletes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-gray-400">
                          Nu exista sportivi{athleteTeamFilter ? ' in echipa selectata' : ''}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {filteredAthletes.length > 10 && (
                <p className="text-xs text-gray-400 mb-4">
                  Se afiseaza primii 10 din {filteredAthletes.length} sportivi. Descarca exportul pentru lista completa.
                </p>
              )}
            </>
          )}

          {/* Export buttons */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => downloadExport('athletes', athleteTeamFilter ? { teamId: athleteTeamFilter } : {})}
              disabled={exporting === 'athletes'}
              className="bg-dinamo-red text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
            >
              {exporting === 'athletes' ? 'Se descarca...' : 'Export CSV'}
            </button>
            <button
              onClick={() => downloadExport('athletes-xml', athleteTeamFilter ? { teamId: athleteTeamFilter } : {})}
              disabled={exporting === 'athletes-xml'}
              className="bg-dinamo-red text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
            >
              {exporting === 'athletes-xml' ? 'Se descarca...' : 'Export XML'}
            </button>
          </div>
        </div>

        {/* Section 2: Rezultate Competitii */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-4">
            <h2 className="font-heading font-bold text-lg">Rezultate Competitii</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Exporta clasamente si rezultate meciuri pentru FRR
            </p>
          </div>

          {loadingCompetitions ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
            </div>
          ) : competitions.length === 0 ? (
            <p className="text-gray-400 text-sm py-4">Nu exista competitii inregistrate.</p>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Selecteaza competitia</label>
                <select
                  value={selectedCompetition}
                  onChange={e => setSelectedCompetition(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none sm:min-w-[300px]"
                >
                  <option value="">-- Alege competitia --</option>
                  {competitions.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.season ? `(${c.season})` : ''} {c.category ? `- ${c.category}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Standings preview */}
              {selectedCompData && selectedCompData.teams && selectedCompData.teams.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-heading font-bold text-sm uppercase text-gray-500 mb-2">Clasament</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-dinamo-blue text-white text-xs uppercase">
                          <th className="px-2 py-2 text-center w-8">#</th>
                          <th className="px-2 py-2 text-left">Echipa</th>
                          <th className="px-2 py-2 text-center w-8">MJ</th>
                          <th className="px-2 py-2 text-center w-8">V</th>
                          <th className="px-2 py-2 text-center w-8">E</th>
                          <th className="px-2 py-2 text-center w-8">I</th>
                          <th className="px-2 py-2 text-center w-10 font-bold">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCompData.teams.map((team, idx) => (
                          <tr
                            key={team.id}
                            className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${idx === 0 ? 'font-semibold' : ''}`}
                          >
                            <td className="px-2 py-2 text-center text-gray-500">{idx + 1}</td>
                            <td className="px-2 py-2 font-medium">{team.teamName}</td>
                            <td className="px-2 py-2 text-center">{team.played}</td>
                            <td className="px-2 py-2 text-center text-green-700">{team.won}</td>
                            <td className="px-2 py-2 text-center text-gray-500">{team.drawn}</td>
                            <td className="px-2 py-2 text-center text-red-600">{team.lost}</td>
                            <td className="px-2 py-2 text-center font-bold text-dinamo-red">{team.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedCompData && selectedCompData.teams && selectedCompData.teams.length === 0 && (
                <p className="text-gray-400 text-sm mb-4">Aceasta competitie nu are echipe inregistrate.</p>
              )}

              {/* Export button */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    if (!selectedCompetition) {
                      alert('Selecteaza o competitie mai intai')
                      return
                    }
                    downloadExport('competition', { competitionId: selectedCompetition })
                  }}
                  disabled={!selectedCompetition || exporting === 'competition'}
                  className="bg-dinamo-red text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
                >
                  {exporting === 'competition' ? 'Se descarca...' : 'Export Rezultate CSV'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Section 3: Raport Prezente */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-4">
            <h2 className="font-heading font-bold text-lg">Raport Prezente</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Exporta rapoarte de prezenta pentru perioada selectata
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">De la</label>
              <input
                type="date"
                value={attendanceFrom}
                onChange={e => setAttendanceFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pana la</label>
              <input
                type="date"
                value={attendanceTo}
                onChange={e => setAttendanceTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Echipa</label>
              <select
                value={attendanceTeamFilter}
                onChange={e => setAttendanceTeamFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
              >
                <option value="">Toate echipele</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.grupa}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary stats */}
          {loadingAttendance ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin w-6 h-6 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
            </div>
          ) : attendanceRecords.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-dinamo-blue">{attendanceSummary.uniqueSessions}</div>
                <div className="text-xs text-gray-500">Sesiuni totale</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-dinamo-blue">{attendanceSummary.totalRecords}</div>
                <div className="text-xs text-gray-500">Inregistrari</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {attendanceSummary.totalRecords > 0
                    ? Math.round((attendanceSummary.presentCount / attendanceSummary.totalRecords) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-gray-500">Rata prezenta</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mb-4">Nu exista inregistrari de prezenta pentru perioada selectata.</p>
          )}

          {/* Export button */}
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => {
                if (!attendanceFrom || !attendanceTo) {
                  alert('Selecteaza perioada de raportare')
                  return
                }
                const params: Record<string, string> = { from: attendanceFrom, to: attendanceTo }
                if (attendanceTeamFilter) params.teamId = attendanceTeamFilter
                downloadExport('attendance', params)
              }}
              disabled={!attendanceFrom || !attendanceTo || exporting === 'attendance'}
              className="bg-dinamo-red text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
            >
              {exporting === 'attendance' ? 'Se descarca...' : 'Export Prezente CSV'}
            </button>
          </div>
        </div>

        {/* Section 4: Documente Necesare */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-4">
            <h2 className="font-heading font-bold text-lg">Documente Necesare</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Checklist documente pentru depunere la Federatia Romana de Rugby
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 border-2 border-gray-300 rounded mt-0.5"></span>
                <div>
                  <span className="font-medium text-gray-800">Lista sportivilor legitimati</span>
                  <p className="text-xs text-gray-500 mt-0.5">Export CSV sau XML cu toti sportivii inregistrati</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 border-2 border-gray-300 rounded mt-0.5"></span>
                <div>
                  <span className="font-medium text-gray-800">Certificate medicale actualizate</span>
                  <p className="text-xs text-gray-500 mt-0.5">Verificati ca toti sportivii au certificat medical valid</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 border-2 border-gray-300 rounded mt-0.5"></span>
                <div>
                  <span className="font-medium text-gray-800">Rezultate competitii sezon curent</span>
                  <p className="text-xs text-gray-500 mt-0.5">Clasamente si rezultate meciuri din sezonul in curs</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 border-2 border-gray-300 rounded mt-0.5"></span>
                <div>
                  <span className="font-medium text-gray-800">Raport prezente lunar</span>
                  <p className="text-xs text-gray-500 mt-0.5">Prezenta la antrenamente si competitii, pe luna</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
