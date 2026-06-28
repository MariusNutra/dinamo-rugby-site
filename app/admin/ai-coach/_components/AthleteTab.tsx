import type { Child, AthleteAnalysis, AthleteRecommendation } from '../_types'
import { RadarChartSVG } from './RadarChartSVG'
import { MonthlyBars } from './MonthlyBars'
import { AttendanceGauge } from './AttendanceGauge'

interface AthleteTabProps {
  athleteSearch: string
  setAthleteSearch: (value: string) => void
  filteredChildren: Child[]
  loadAthleteAnalysis: (childId: string) => void
  selectedChildId: string | null
  loadingAthlete: boolean
  athleteData: {
    analysis: AthleteAnalysis
    recommendations: AthleteRecommendation
  } | null
}

export function AthleteTab({
  athleteSearch,
  setAthleteSearch,
  filteredChildren,
  loadAthleteAnalysis,
  selectedChildId,
  loadingAthlete,
  athleteData,
}: AthleteTabProps) {
  return (
    <div>
      {/* Athlete search */}
      <div className="mb-6 relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">Cauta sportiv</label>
        <input
          type="text"
          placeholder="Scrie numele sportivului..."
          value={athleteSearch}
          onChange={e => setAthleteSearch(e.target.value)}
          className="w-full md:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
        {filteredChildren.length > 0 && (
          <div className="absolute z-10 mt-1 w-full md:w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredChildren.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  loadAthleteAnalysis(c.id)
                  setAthleteSearch('')
                }}
                className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                  selectedChildId === c.id ? 'bg-red-50' : ''
                }`}
              >
                <p className="text-sm font-medium text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-500">{c.team?.grupa || 'Fara echipa'}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {loadingAthlete ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
        </div>
      ) : athleteData ? (
        <div className="space-y-6">
          {/* Athlete header */}
          <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{athleteData.analysis.childName}</h2>
                <p className="text-sm text-gray-500">{athleteData.analysis.teamName || 'Fara echipa'}</p>
              </div>
              <div className="flex gap-3">
                {athleteData.analysis.attendanceRate !== null && (
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      athleteData.analysis.attendanceRate >= 80 ? 'text-green-600' :
                      athleteData.analysis.attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {athleteData.analysis.attendanceRate}%
                    </p>
                    <p className="text-xs text-gray-500">Prezenta</p>
                  </div>
                )}
                {athleteData.analysis.latestEvaluation && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {((athleteData.analysis.latestEvaluation.physical +
                        athleteData.analysis.latestEvaluation.technical +
                        athleteData.analysis.latestEvaluation.tactical +
                        athleteData.analysis.latestEvaluation.mental +
                        athleteData.analysis.latestEvaluation.social) / 5).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">Scor mediu</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Risk alerts */}
          {athleteData.recommendations.riskAlerts.length > 0 && (
            <div className="space-y-2">
              {athleteData.recommendations.riskAlerts.map((alert, i) => (
                <div key={i} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm text-red-800">{alert}</p>
                </div>
              ))}
            </div>
          )}

          {/* Positive notes */}
          {athleteData.recommendations.positiveNotes.length > 0 && (
            <div className="space-y-2">
              {athleteData.recommendations.positiveNotes.map((note, i) => (
                <div key={i} className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-800">{note}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-2 text-center">Profil Competente</h3>
              {athleteData.analysis.latestEvaluation ? (
                <RadarChartSVG scores={athleteData.analysis.latestEvaluation} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                  Nu exista evaluari
                </div>
              )}
              {athleteData.analysis.latestEvaluation && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Evaluare: {athleteData.analysis.latestEvaluation.period}
                  {' '}({new Date(athleteData.analysis.latestEvaluation.date).toLocaleDateString('ro-RO')})
                </p>
              )}
            </div>

            {/* Attendance trend */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-4 text-center">Tendinta Prezenta (6 luni)</h3>
              {athleteData.analysis.monthlyAttendance.some(m => m.total > 0) ? (
                <MonthlyBars data={athleteData.analysis.monthlyAttendance} />
              ) : (
                <div className="h-[160px] flex items-center justify-center text-gray-400 text-sm">
                  Nu exista date de prezenta
                </div>
              )}
              {athleteData.analysis.attendanceRateLast3Months !== null && (
                <div className="mt-4">
                  <AttendanceGauge
                    rate={athleteData.analysis.attendanceRateLast3Months}
                    label="Prezenta ultimele 3 luni"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Skill progression */}
          {athleteData.analysis.latestEvaluation && athleteData.analysis.previousEvaluation && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Progresie Competente
              </h3>
              <div className="space-y-3">
                {athleteData.analysis.skillTrends.map(st => {
                  const changeColor = st.change !== null
                    ? st.change > 0 ? 'text-green-600' : st.change < 0 ? 'text-red-600' : 'text-gray-500'
                    : 'text-gray-400'
                  const changeIcon = st.change !== null
                    ? st.change > 0 ? (
                      <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    ) : st.change < 0 ? (
                      <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                      </svg>
                    )
                    : null

                  return (
                    <div key={st.skill} className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-700 w-16">{st.label}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-6 text-right">{st.previous ?? '-'}</span>
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span className="text-sm font-bold text-gray-900 w-6">{st.current ?? '-'}</span>
                      </div>
                      <span className={`text-sm font-semibold flex items-center gap-1 w-16 justify-end ${changeColor}`}>
                        {changeIcon}
                        {st.change !== null ? (st.change > 0 ? `+${st.change}` : st.change) : '-'}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                <span>Anterior: {athleteData.analysis.previousEvaluation.period}</span>
                <span>Curent: {athleteData.analysis.latestEvaluation.period}</span>
              </div>
            </div>
          )}

          {/* Physical growth */}
          {athleteData.analysis.physicalGrowth && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Dezvoltare Fizica
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {athleteData.analysis.physicalGrowth.latestHeight && (
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-800">{athleteData.analysis.physicalGrowth.latestHeight}</p>
                    <p className="text-xs text-gray-500">Inaltime (cm)</p>
                    {athleteData.analysis.physicalGrowth.heightChange !== null && (
                      <p className={`text-xs font-semibold mt-1 ${athleteData.analysis.physicalGrowth.heightChange > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {athleteData.analysis.physicalGrowth.heightChange > 0 ? '+' : ''}{athleteData.analysis.physicalGrowth.heightChange} cm
                      </p>
                    )}
                  </div>
                )}
                {athleteData.analysis.physicalGrowth.latestWeight && (
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-800">{athleteData.analysis.physicalGrowth.latestWeight}</p>
                    <p className="text-xs text-gray-500">Greutate (kg)</p>
                    {athleteData.analysis.physicalGrowth.weightChange !== null && (
                      <p className={`text-xs font-semibold mt-1 ${athleteData.analysis.physicalGrowth.weightChange > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                        {athleteData.analysis.physicalGrowth.weightChange > 0 ? '+' : ''}{athleteData.analysis.physicalGrowth.weightChange} kg
                      </p>
                    )}
                  </div>
                )}
                {athleteData.analysis.physicalGrowth.position && (
                  <div className="bg-gray-50 rounded-lg p-3 text-center col-span-2">
                    <p className="text-lg font-bold text-gray-800">{athleteData.analysis.physicalGrowth.position}</p>
                    <p className="text-xs text-gray-500">Pozitie</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {athleteData.recommendations.textRecommendations.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Recomandari
              </h3>
              <div className="space-y-2">
                {athleteData.recommendations.textRecommendations.map((rec, i) => (
                  <div key={i} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          {(athleteData.analysis.strengths.length > 0 || athleteData.analysis.weaknesses.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {athleteData.analysis.strengths.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Puncte Forte
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {athleteData.analysis.strengths.map(s => (
                      <span key={s} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {athleteData.analysis.weaknesses.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    De Imbunatatit
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {athleteData.analysis.weaknesses.map(w => (
                      <span key={w} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p>Cauta un sportiv pentru a vedea analiza detaliata</p>
        </div>
      )}
    </div>
  )
}
