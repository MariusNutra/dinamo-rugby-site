import type { Team, TeamSuggestion } from '../_types'
import { AttendanceGauge } from './AttendanceGauge'

interface TeamTabProps {
  teams: Team[]
  selectedTeamId: number | null
  loadTeamAnalysis: (teamId: number) => void
  loadingTeam: boolean
  teamData: TeamSuggestion | null
  onAthleteClick: (childId: string) => void
}

export function TeamTab({
  teams,
  selectedTeamId,
  loadTeamAnalysis,
  loadingTeam,
  teamData,
  onAthleteClick,
}: TeamTabProps) {
  return (
    <div>
      {/* Team selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecteaza echipa</label>
        <select
          value={selectedTeamId || ''}
          onChange={e => {
            const val = e.target.value
            if (val) loadTeamAnalysis(Number(val))
          }}
          className="w-full md:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          <option value="">-- Alege echipa --</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.grupa}</option>
          ))}
        </select>
      </div>

      {loadingTeam ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
        </div>
      ) : teamData ? (
        <div className="space-y-6">
          {/* Team header stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{teamData.totalAthletes}</p>
              <p className="text-sm text-gray-500">Sportivi</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2 text-center">Prezenta medie (3 luni)</p>
              <AttendanceGauge rate={teamData.averageAttendanceRate} />
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{teamData.atRiskAthletes.length}</p>
              <p className="text-sm text-gray-500">Sportivi la risc</p>
            </div>
          </div>

          {/* Recommendations */}
          {teamData.recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Recomandari
              </h3>
              <div className="space-y-2">
                {teamData.recommendations.map((rec, i) => (
                  <div key={i} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Top Performeri
              </h3>
              {teamData.topPerformers.length === 0 ? (
                <p className="text-sm text-gray-500">Nu exista evaluari.</p>
              ) : (
                <div className="space-y-2">
                  {teamData.topPerformers.map((p, i) => (
                    <div
                      key={p.childId}
                      onClick={() => onAthleteClick(p.childId)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-gray-100 text-gray-600' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium text-gray-800">{p.name}</span>
                      <span className="text-sm font-bold text-green-600">{p.averageScore.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* At-Risk Athletes */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Sportivi la Risc
              </h3>
              {teamData.atRiskAthletes.length === 0 ? (
                <p className="text-sm text-gray-500">Niciun sportiv la risc.</p>
              ) : (
                <div className="space-y-2">
                  {teamData.atRiskAthletes.map(a => (
                    <div
                      key={a.childId}
                      onClick={() => onAthleteClick(a.childId)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                    >
                      <span className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                        </svg>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{a.name}</p>
                        <p className="text-xs text-red-600">{a.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Declining Athletes */}
          {teamData.decliningAthletes.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                Performanta in Scadere
              </h3>
              <div className="space-y-2">
                {teamData.decliningAthletes.map(a => (
                  <div
                    key={a.childId}
                    onClick={() => onAthleteClick(a.childId)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
                  >
                    <span className="flex-1 text-sm font-medium text-gray-800">{a.name}</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {a.decliningSkills.map(s => (
                        <span key={s} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Focus Areas */}
          {teamData.focusAreas.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Arii de Focus
              </h3>
              <div className="space-y-3">
                {teamData.focusAreas.map(fa => {
                  const barColor = fa.averageScore >= 7 ? 'bg-green-500' : fa.averageScore >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                  return (
                    <div key={fa.skill}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{fa.label}</span>
                        <span className="text-sm font-bold text-gray-900">{fa.averageScore}/10</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2.5 mb-1">
                        <div
                          className={`h-full rounded-full ${barColor} transition-all duration-500`}
                          style={{ width: `${(fa.averageScore / 10) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">{fa.recommendation}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>Selecteaza o echipa pentru a vedea analiza</p>
        </div>
      )}
    </div>
  )
}
