import Link from 'next/link'
import { getLatestDinamoResults } from '@/lib/results'

export default function LatestResults() {
  const results = getLatestDinamoResults(5)

  if (results.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-lg text-gray-900">
          Ultimele rezultate Dinamo
        </h3>
        <Link href="/rezultate" className="text-dinamo-red text-sm font-bold hover:underline">
          Toate →
        </Link>
      </div>

      <div className="space-y-2">
        {results.map((r, idx) => {
          const isDinamoHome = /dinamo/i.test(r.match.homeTeam)
          const dinamoScore = isDinamoHome ? r.match.scoreHome : r.match.scoreAway
          const opponentScore = isDinamoHome ? r.match.scoreAway : r.match.scoreHome
          const opponent = isDinamoHome ? r.match.awayTeam : r.match.homeTeam

          let resultColor = 'bg-gray-100 text-gray-600' // draw
          let resultLabel = 'E'
          if (dinamoScore !== null && opponentScore !== null) {
            if (dinamoScore > opponentScore) {
              resultColor = 'bg-green-100 text-green-700'
              resultLabel = 'V'
            } else if (dinamoScore < opponentScore) {
              resultColor = 'bg-red-100 text-red-700'
              resultLabel = 'I'
            }
          }

          return (
            <div
              key={idx}
              className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
            >
              <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${resultColor}`}>
                {resultLabel}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  <span className="text-gray-400">{r.category}:</span>{' '}
                  Dinamo {dinamoScore}–{opponentScore} {opponent}
                </p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {r.match.date}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
