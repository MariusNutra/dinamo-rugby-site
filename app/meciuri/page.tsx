'use client'

import { useEffect, useState } from 'react'

interface Match {
  id: number
  grupa: string
  date: string
  opponent: string
  location: string | null
  scoreHome: number | null
  scoreAway: number | null
  description: string | null
}

const grupe = ['Toate', 'U10', 'U12', 'U14', 'U16', 'U18']

const grupaColors: Record<string, string> = {
  U10: 'bg-green-100 text-green-800',
  U12: 'bg-blue-100 text-blue-800',
  U14: 'bg-red-100 text-red-800',
  U16: 'bg-purple-100 text-purple-800',
  U18: 'bg-gray-100 text-gray-800',
}

export default function MeciuriPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [filter, setFilter] = useState('Toate')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = filter === 'Toate' ? '/api/matches' : `/api/matches?grupa=${filter}`
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
          <p className="text-lg opacity-90">Meciuri viitoare și rezultate pentru echipele Dinamo Rugby Juniori</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {grupe.map(g => (
            <button key={g} onClick={() => { setFilter(g); setLoading(true) }}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                filter === g ? 'bg-dinamo-red text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
              {g}
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
                    <div key={match.id} className="bg-white rounded-xl shadow-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-2xl font-heading font-bold text-dinamo-red">
                            {new Date(match.date).getDate()}
                          </div>
                          <div className="text-xs text-gray-500 uppercase">
                            {new Date(match.date).toLocaleDateString('ro-RO', { month: 'short' })}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(match.date).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">Dinamo vs {match.opponent}</div>
                          {match.location && (
                            <p className="text-sm text-gray-500 mt-1">{match.location}</p>
                          )}
                          {match.description && (
                            <p className="text-sm text-gray-400 mt-1">{match.description}</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${grupaColors[match.grupa] || 'bg-gray-100 text-gray-700'}`}>
                        {match.grupa}
                      </span>
                    </div>
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
                    <div key={match.id} className="bg-white rounded-xl shadow-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-sm font-medium text-gray-600">
                            {new Date(match.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(match.date).getFullYear()}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">Dinamo vs {match.opponent}</div>
                          {match.location && (
                            <p className="text-sm text-gray-500 mt-1">{match.location}</p>
                          )}
                          {match.description && (
                            <p className="text-sm text-gray-400 mt-1">{match.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${grupaColors[match.grupa] || 'bg-gray-100 text-gray-700'}`}>
                          {match.grupa}
                        </span>
                        {match.scoreHome !== null && match.scoreAway !== null ? (
                          <div className="text-right">
                            <div className={`text-xl font-heading font-bold ${
                              match.scoreHome > match.scoreAway ? 'text-green-600' :
                              match.scoreHome < match.scoreAway ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {match.scoreHome} - {match.scoreAway}
                            </div>
                            <span className="text-xs text-gray-400">
                              {match.scoreHome > match.scoreAway ? 'Victorie' :
                               match.scoreHome < match.scoreAway ? 'Înfrângere' : 'Egal'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Fără scor</span>
                        )}
                      </div>
                    </div>
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
