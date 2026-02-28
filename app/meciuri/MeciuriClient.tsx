'use client'

import { useState } from 'react'

interface Match {
  id: string
  category: string
  matchType: string
  round: string | null
  date: string
  location: string | null
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  isDinamo: boolean
  notes: string | null
}

const catColors: Record<string, string> = {
  U10: 'bg-green-100 text-green-800',
  U12: 'bg-blue-100 text-blue-800',
  U14: 'bg-red-100 text-red-800',
  U16: 'bg-purple-100 text-purple-800',
  U18: 'bg-gray-100 text-gray-800',
}

export default function MeciuriClient({ matches: allMatches, categories }: { matches: Match[]; categories: string[] }) {
  const [filter, setFilter] = useState('Toate')

  const matches = filter === 'Toate' ? allMatches : allMatches.filter(m => m.category === filter)

  const now = new Date()
  const upcoming = matches.filter(m => new Date(m.date) >= now).reverse()
  const past = matches.filter(m => new Date(m.date) < now)

  const totalEmpty = allMatches.length === 0

  return (
    <>
      <section className="bg-gradient-to-br from-dinamo-blue to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-3">Calendar Meciuri</h1>
          <p className="text-lg opacity-90">Meciuri și rezultate pentru echipele de mini rugby Dinamo</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                filter === c ? 'bg-dinamo-red text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {totalEmpty ? (
          /* Full empty state when no matches at all */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-bold text-dinamo-blue mb-3">
              Încă nu sunt meciuri programate
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Calendarul meciurilor va fi actualizat în curând. Revino pentru a vedea programul competițiilor!
            </p>
          </div>
        ) : (
          <>
            {/* Upcoming matches */}
            <section className="mb-12">
              <h2 className="font-heading font-bold text-2xl mb-6 text-gray-900 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>
                Meciuri viitoare
              </h2>
              {upcoming.length > 0 ? (
                <div className="space-y-3">
                  {upcoming.map(match => (
                    <MatchCard key={match.id} match={match} isUpcoming />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <p className="text-gray-400 font-medium">Nu sunt meciuri viitoare programate{filter !== 'Toate' ? ` pentru ${filter}` : ''}.</p>
                </div>
              )}
            </section>

            {/* Past matches */}
            <section>
              <h2 className="font-heading font-bold text-2xl mb-6 text-gray-900 flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-400 rounded-full inline-block"></span>
                Rezultate
              </h2>
              {past.length > 0 ? (
                <div className="space-y-3">
                  {past.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-2.927 0" />
                  </svg>
                  <p className="text-gray-400 font-medium">Nu sunt rezultate încă{filter !== 'Toate' ? ` pentru ${filter}` : ''}.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  )
}

function MatchCard({ match, isUpcoming }: { match: Match; isUpcoming?: boolean }) {
  const hasScore = match.homeScore != null && match.awayScore != null
  const isDinamoHome = /dinamo/i.test(match.homeTeam)

  let resultColor = 'text-gray-600'
  if (hasScore && match.isDinamo) {
    const dinamoScore = isDinamoHome ? match.homeScore! : match.awayScore!
    const opponentScore = isDinamoHome ? match.awayScore! : match.homeScore!
    if (dinamoScore > opponentScore) resultColor = 'text-green-600'
    else if (dinamoScore < opponentScore) resultColor = 'text-red-600'
  }

  return (
    <div className={`bg-white rounded-xl shadow-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
      match.isDinamo ? 'border-l-4 border-l-dinamo-red' : ''
    }`}>
      <div className="flex items-start gap-4">
        <div className="text-center min-w-[60px]">
          {isUpcoming ? (
            <>
              <div className="text-2xl font-heading font-bold text-dinamo-red">
                {new Date(match.date).getDate()}
              </div>
              <div className="text-xs text-gray-500 uppercase">
                {new Date(match.date).toLocaleDateString('ro-RO', { month: 'short' })}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(match.date).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-medium text-gray-600">
                {new Date(match.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(match.date).getFullYear()}
              </div>
            </>
          )}
        </div>
        <div>
          <div className={`${match.isDinamo ? 'font-bold' : 'font-medium'} text-gray-900`}>
            {match.homeTeam} vs {match.awayTeam}
          </div>
          {match.round && (
            <p className="text-xs text-gray-400 mt-0.5">{match.round}</p>
          )}
          {match.location && (
            <p className="text-sm text-gray-500 mt-1">{match.location}</p>
          )}
          {match.notes && (
            <p className="text-sm text-gray-400 mt-1">{match.notes}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${catColors[match.category] || 'bg-gray-100 text-gray-700'}`}>
          {match.category}
        </span>
        {hasScore ? (
          <div className="text-right">
            <div className={`text-xl font-heading font-bold ${resultColor}`}>
              {match.homeScore} - {match.awayScore}
            </div>
            {match.isDinamo && (
              <span className="text-xs text-gray-400">
                {(() => {
                  const ds = isDinamoHome ? match.homeScore! : match.awayScore!
                  const os = isDinamoHome ? match.awayScore! : match.homeScore!
                  return ds > os ? 'Victorie' : ds < os ? 'Înfrângere' : 'Egal'
                })()}
              </span>
            )}
          </div>
        ) : isUpcoming ? (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
            Urmează
          </span>
        ) : (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
            Fără scor
          </span>
        )}
      </div>
    </div>
  )
}
