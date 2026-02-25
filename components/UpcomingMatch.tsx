import Link from 'next/link'
import { getNextDinamoMatch, getLatestDinamoResults } from '@/lib/results'

export default function UpcomingMatch() {
  const nextMatch = getNextDinamoMatch()
  const latestResults = getLatestDinamoResults(1)
  const lastResult = latestResults.length > 0 ? latestResults[0] : null

  if (!nextMatch && !lastResult) return null

  const match = nextMatch || lastResult!
  const isUpcoming = !!nextMatch

  const opponent = /dinamo/i.test(match.match.homeTeam)
    ? match.match.awayTeam
    : match.match.homeTeam
  const isHome = /dinamo/i.test(match.match.homeTeam)

  return (
    <Link
      href="/rezultate"
      className="block bg-gradient-to-r from-dinamo-red to-dinamo-dark rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wide opacity-80">
          {isUpcoming ? 'Următorul meci' : 'Ultimul rezultat'}
        </span>
        <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-bold">
          {match.category}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-heading font-bold text-lg">
            {isHome ? 'Dinamo' : opponent}
          </p>
          <p className="text-sm opacity-80">vs</p>
          <p className="font-heading font-bold text-lg">
            {isHome ? opponent : 'Dinamo'}
          </p>
        </div>

        {match.match.played ? (
          <div className="text-center">
            <p className="font-heading font-extrabold text-3xl">
              {match.match.scoreHome} – {match.match.scoreAway}
            </p>
            <p className="text-xs opacity-75 mt-1">Final</p>
          </div>
        ) : (
          <div className="text-right">
            <p className="font-heading font-bold text-sm opacity-90">{match.match.date}</p>
            {match.match.stadium && (
              <p className="text-xs opacity-70 mt-1">{match.match.stadium}</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 text-xs opacity-70 flex items-center justify-between">
        <span>{match.region !== 'National' ? `${match.region}` : ''}</span>
        <span className="font-medium">Vezi detalii →</span>
      </div>
    </Link>
  )
}
