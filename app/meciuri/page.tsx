'use client'

import { useEffect, useState } from 'react'

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

export default function MeciuriPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [filter, setFilter] = useState<string>('Toate')
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>(['Toate'])

  useEffect(() => {
    fetch('/api/teams?active=1')
      .then(r => r.json())
      .then((teams: { grupa: string }[]) => {
        if (teams.length > 0) {
          setCategories(['Toate', ...teams.map(t => t.grupa)])
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const url = filter === 'Toate' ? '/api/matches' : `/api/matches?category=${filter}`
    fetch(url).then(r => r.json()).then(data => {
      setMatches(data)
      setLoading(false)
    })
  }, [filter])

  const now = new Date()
  const upcoming = matches.filter(m => new Date(m.date) >= now).reverse()
  const past = matches.filter(m => new Date(m.date) < now)

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

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full mx-auto"></div>
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
                <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
                  Nu sunt meciuri programate.
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
                <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
                  Nu sunt rezultate încă.
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
