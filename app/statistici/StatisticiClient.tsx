'use client'

import { useState } from 'react'

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

export default function StatisticiClient({ initialStats, teams }: { initialStats: StatsData; teams: Team[] }) {
  const [stats, setStats] = useState<StatsData>(initialStats)
  const [selectedTeam, setSelectedTeam] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTeamChange = async (value: string) => {
    setSelectedTeam(value)
    setLoading(true)
    try {
      const url = value ? `/api/statistici?teamId=${value}` : '/api/statistici'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      // Keep current stats on error
    }
    setLoading(false)
  }

  const maxEvalScore = stats?.topEvaluations?.[0]?.averageScore ?? 10
  const hasAnyData = stats.teamStats.length > 0 || stats.topAttendance.length > 0 || stats.topEvaluations.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-dinamo-blue text-white py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="font-heading text-3xl md:text-4xl font-bold">Statistici</h1>
          <p className="mt-2 text-blue-200">Prezenta, evaluari si performanta sportivilor</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Team Filter */}
        <div className="mb-8">
          <label htmlFor="team-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filtreaza dupa echipa
          </label>
          <select
            id="team-filter"
            value={selectedTeam}
            onChange={e => handleTeamChange(e.target.value)}
            className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dinamo-blue focus:border-dinamo-blue"
          >
            <option value="">Toate echipele</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>
                {t.grupa}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-gray-500">Se incarca statisticile...</p>
          </div>
        ) : !hasAnyData ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <h2 className="font-heading text-xl font-bold text-dinamo-blue mb-2">Nu există date statistice</h2>
            <p className="text-gray-500">
              Statisticile vor fi disponibile după înregistrarea prezențelor și evaluărilor.
            </p>
          </div>
        ) : (
          <>
            {/* Section 1: Team Overview */}
            <section className="mb-12">
              <h2 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">
                Prezentare Echipe
              </h2>
              {stats.teamStats.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                  <p className="text-gray-400 font-medium">Nu există date pentru echipe.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.teamStats.map(team => (
                    <div key={team.teamId} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                      <h3 className="font-heading text-lg font-bold text-dinamo-blue mb-3">{team.grupa}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total sportivi</span>
                          <span className="text-lg font-bold text-dinamo-blue">{team.totalChildren}</span>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600">Prezenta medie</span>
                            <span className="text-sm font-semibold text-dinamo-blue">{team.avgAttendance}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-dinamo-red h-2.5 rounded-full transition-all duration-500" style={{ width: `${team.avgAttendance}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600">Evaluare medie</span>
                            <span className="text-sm font-semibold text-dinamo-blue">{team.avgEvaluation} / 10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-dinamo-blue h-2.5 rounded-full transition-all duration-500" style={{ width: `${(team.avgEvaluation / 10) * 100}%` }} />
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
              <h2 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">Top Prezenta</h2>
              {stats.topAttendance.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <p className="text-gray-400 font-medium">Nu există date de prezență.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-dinamo-blue text-white">
                          <th className="px-4 py-3 text-sm font-semibold w-12">#</th>
                          <th className="px-4 py-3 text-sm font-semibold">Nume</th>
                          <th className="px-4 py-3 text-sm font-semibold">Echipa</th>
                          <th className="px-4 py-3 text-sm font-semibold text-center">Total prezente</th>
                          <th className="px-4 py-3 text-sm font-semibold text-center">Procent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stats.topAttendance.map((entry, idx) => (
                          <tr key={entry.childId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-bold text-dinamo-red">{idx + 1}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{entry.grupa}</td>
                            <td className="px-4 py-3 text-sm text-center font-semibold">
                              {entry.totalPresent}
                              <span className="text-gray-400 font-normal"> / {entry.totalSessions}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div className="bg-dinamo-red h-2 rounded-full transition-all duration-500" style={{ width: `${entry.percent}%` }} />
                                </div>
                                <span className="text-sm font-semibold text-dinamo-blue w-10 text-right">{entry.percent}%</span>
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
              <h2 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">Top Evaluari</h2>
              {stats.topEvaluations.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                  <p className="text-gray-400 font-medium">Nu există date de evaluare.</p>
                </div>
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
                            <td className="px-4 py-3 text-sm font-bold text-dinamo-red">{idx + 1}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{entry.grupa}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                  <div className="bg-gradient-to-r from-dinamo-red to-dinamo-blue h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${maxEvalScore > 0 ? (entry.averageScore / 10) * 100 : 0}%` }} />
                                </div>
                                <span className="text-sm font-bold text-dinamo-blue w-14 text-right">{entry.averageScore} / 10</span>
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
