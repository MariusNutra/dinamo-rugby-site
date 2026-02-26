'use client'

import { useEffect, useState } from 'react'

interface TeamStat {
  teamId: number
  grupa: string
  totalChildren: number
  avgAttendance: number
  avgEvaluation: number
}

interface AttendanceEntry {
  childId: string
  name: string
  teamId: number | null
  grupa: string
  totalPresent: number
  totalSessions: number
  percent: number
}

interface EvaluationEntry {
  childId: string
  name: string
  teamId: number | null
  grupa: string
  averageScore: number
}

interface Team {
  id: number
  grupa: string
}

interface StatsData {
  topAttendance: AttendanceEntry[]
  topEvaluations: EvaluationEntry[]
  teamStats: TeamStat[]
}

export default function StatisticiPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/teams?active=1')
      .then((r) => r.json())
      .then((data) => setTeams(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    const url = selectedTeam ? `/api/statistici?teamId=${selectedTeam}` : '/api/statistici'
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Eroare server')
        return r.json()
      })
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Nu s-au putut incarca statisticile.')
        setLoading(false)
      })
  }, [selectedTeam])

  const maxEvalScore = stats?.topEvaluations?.[0]?.averageScore ?? 10

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dinamo-blue">Statistici</h1>
          <p className="text-sm text-gray-500 mt-1">Prezenta, evaluari si performanta sportivilor</p>
        </div>
      </div>

      <div>
        {/* Team Filter */}
        <div className="mb-8">
          <label htmlFor="team-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filtreaza dupa echipa
          </label>
          <select
            id="team-filter"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dinamo-blue focus:border-dinamo-blue"
          >
            <option value="">Toate echipele</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.grupa}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-gray-500">Se incarca statisticile...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
            {error}
          </div>
        )}

        {stats && !loading && (
          <>
            {/* Section 1: Team Overview */}
            <section className="mb-12">
              <h2 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">
                Prezentare Echipe
              </h2>
              {stats.teamStats.length === 0 ? (
                <p className="text-gray-500">Nu exista date pentru echipe.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.teamStats.map((team) => (
                    <div
                      key={team.teamId}
                      className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-heading text-lg font-bold text-dinamo-blue mb-3">
                        {team.grupa}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total sportivi</span>
                          <span className="text-lg font-bold text-dinamo-blue">
                            {team.totalChildren}
                          </span>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600">Prezenta medie</span>
                            <span className="text-sm font-semibold text-dinamo-blue">
                              {team.avgAttendance}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-dinamo-red h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${team.avgAttendance}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600">Evaluare medie</span>
                            <span className="text-sm font-semibold text-dinamo-blue">
                              {team.avgEvaluation} / 10
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-dinamo-blue h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${(team.avgEvaluation / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 2: Top Prezenta */}
            <section className="mb-12">
              <h2 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">
                Top Prezenta
              </h2>
              {stats.topAttendance.length === 0 ? (
                <p className="text-gray-500">Nu exista date de prezenta.</p>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-dinamo-blue text-white">
                          <th className="px-4 py-3 text-sm font-semibold w-12">#</th>
                          <th className="px-4 py-3 text-sm font-semibold">Nume</th>
                          <th className="px-4 py-3 text-sm font-semibold">Echipa</th>
                          <th className="px-4 py-3 text-sm font-semibold text-center">
                            Total prezente
                          </th>
                          <th className="px-4 py-3 text-sm font-semibold text-center">Procent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stats.topAttendance.map((entry, idx) => (
                          <tr key={entry.childId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-bold text-dinamo-red">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {entry.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{entry.grupa}</td>
                            <td className="px-4 py-3 text-sm text-center font-semibold">
                              {entry.totalPresent}
                              <span className="text-gray-400 font-normal">
                                {' '}
                                / {entry.totalSessions}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-dinamo-red h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${entry.percent}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-dinamo-blue w-10 text-right">
                                  {entry.percent}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* Section 3: Top Evaluari */}
            <section className="mb-12">
              <h2 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">
                Top Evaluari
              </h2>
              {stats.topEvaluations.length === 0 ? (
                <p className="text-gray-500">Nu exista date de evaluare.</p>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-dinamo-blue text-white">
                          <th className="px-4 py-3 text-sm font-semibold w-12">#</th>
                          <th className="px-4 py-3 text-sm font-semibold">Nume</th>
                          <th className="px-4 py-3 text-sm font-semibold">Echipa</th>
                          <th className="px-4 py-3 text-sm font-semibold">Scor mediu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stats.topEvaluations.map((entry, idx) => (
                          <tr key={entry.childId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-bold text-dinamo-red">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {entry.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{entry.grupa}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                  <div
                                    className="bg-gradient-to-r from-dinamo-red to-dinamo-blue h-3 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${maxEvalScore > 0 ? (entry.averageScore / 10) * 100 : 0}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-dinamo-blue w-14 text-right">
                                  {entry.averageScore} / 10
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
