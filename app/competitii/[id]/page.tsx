import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  liga: 'Liga',
  turneu: 'Turneu',
  cupa: 'Cupa',
}

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const competition = await prisma.competition.findUnique({
    where: { id: params.id },
    select: { name: true, category: true, season: true, description: true },
  })

  if (!competition) {
    return { title: 'Competitie negasita | Dinamo Rugby Juniori' }
  }

  const parts = [competition.name]
  if (competition.category) parts.push(competition.category)
  if (competition.season) parts.push(competition.season)

  return {
    title: `${parts.join(' - ')} | Dinamo Rugby Juniori`,
    description: competition.description || `Clasament si rezultate ${competition.name}`,
  }
}

export default async function CompetitieDetailPage({ params }: PageProps) {
  const competition = await prisma.competition.findUnique({
    where: { id: params.id },
    include: {
      teams: true,
      matches: {
        orderBy: { date: 'desc' },
      },
    },
  })

  if (!competition) {
    notFound()
  }

  // Sort teams by points desc, goal difference desc, goalsFor desc
  const sortedTeams = [...competition.teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const gdA = a.goalsFor - a.goalsAgainst
    const gdB = b.goalsFor - b.goalsAgainst
    if (gdB !== gdA) return gdB - gdA
    return b.goalsFor - a.goalsFor
  })

  // Group matches by round
  const matchesByRound: Record<string, typeof competition.matches> = {}
  for (const match of competition.matches) {
    const round = match.round || 'Fara runda'
    if (!matchesByRound[round]) matchesByRound[round] = []
    matchesByRound[round].push(match)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/competitii" className="text-sm text-dinamo-red hover:underline">
          &larr; Toate competitiile
        </Link>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-dinamo-blue to-dinamo-blue/80 rounded-xl p-6 md:p-8 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20">
                {TYPE_LABELS[competition.type] || competition.type}
              </span>
              {competition.category && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20">
                  {competition.category}
                </span>
              )}
            </div>
            <h1 className="font-heading font-bold text-2xl md:text-3xl mb-2">
              {competition.name}
            </h1>
            {competition.description && (
              <p className="text-white/80 text-sm md:text-base mb-3">
                {competition.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-white/70">
              {competition.season && (
                <span>Sezon: {competition.season}</span>
              )}
              {competition.startDate && (
                <span>
                  {formatDate(competition.startDate)}
                  {competition.endDate && ` — ${formatDate(competition.endDate)}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Standings */}
      {sortedTeams.length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading font-bold text-xl text-gray-900 mb-4">Clasament</h2>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dinamo-blue text-white">
                    <th className="px-3 py-3 text-center w-12 text-xs font-bold">#</th>
                    <th className="px-4 py-3 text-left text-xs font-bold">ECHIPA</th>
                    <th className="px-3 py-3 text-center w-12 text-xs font-bold">MJ</th>
                    <th className="px-3 py-3 text-center w-12 text-xs font-bold">V</th>
                    <th className="px-3 py-3 text-center w-12 text-xs font-bold">E</th>
                    <th className="px-3 py-3 text-center w-12 text-xs font-bold">I</th>
                    <th className="px-3 py-3 text-center w-14 text-xs font-bold">GM</th>
                    <th className="px-3 py-3 text-center w-14 text-xs font-bold">GP</th>
                    <th className="px-3 py-3 text-center w-14 text-xs font-bold">GD</th>
                    <th className="px-3 py-3 text-center w-14 text-xs font-bold">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeams.map((team, idx) => {
                    const gd = team.goalsFor - team.goalsAgainst
                    const isDinamo = team.teamName.toLowerCase().includes('dinamo')
                    return (
                      <tr
                        key={team.id}
                        className={`border-b border-gray-100 transition-colors ${
                          isDinamo ? 'bg-red-50/60 font-semibold' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                        }`}
                      >
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-gray-300 text-white' : idx === 2 ? 'bg-amber-700 text-white' : 'text-gray-500'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={isDinamo ? 'text-dinamo-red font-bold' : ''}>
                            {team.teamName}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-gray-600">{team.played}</td>
                        <td className="px-3 py-3 text-center text-green-700 font-medium">{team.won}</td>
                        <td className="px-3 py-3 text-center text-gray-500">{team.drawn}</td>
                        <td className="px-3 py-3 text-center text-red-600">{team.lost}</td>
                        <td className="px-3 py-3 text-center text-gray-600">{team.goalsFor}</td>
                        <td className="px-3 py-3 text-center text-gray-600">{team.goalsAgainst}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={gd > 0 ? 'text-green-700' : gd < 0 ? 'text-red-600' : 'text-gray-500'}>
                            {gd > 0 ? '+' : ''}{gd}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-lg text-dinamo-blue">{team.points}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400">
              MJ = Meciuri Jucate, V = Victorii, E = Egaluri, I = Infrangeri, GM = Goluri Marcate, GP = Goluri Primite, GD = Golaveraj, PTS = Puncte
            </div>
          </div>
        </div>
      )}

      {/* Matches grouped by round */}
      {competition.matches.length > 0 && (
        <div>
          <h2 className="font-heading font-bold text-xl text-gray-900 mb-4">Meciuri</h2>
          <div className="space-y-6">
            {Object.entries(matchesByRound).map(([round, matches]) => (
              <div key={round}>
                <h3 className="font-heading font-bold text-sm uppercase text-gray-500 mb-2 px-1">
                  {round}
                </h3>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  {matches.map((match, idx) => {
                    const hasScore = match.homeScore !== null && match.awayScore !== null
                    return (
                      <div
                        key={match.id}
                        className={`px-4 py-3 flex items-center gap-4 ${idx > 0 ? 'border-t border-gray-100' : ''}`}
                      >
                        {/* Date */}
                        <div className="text-xs text-gray-400 w-16 shrink-0 text-center">
                          <div>{match.date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}</div>
                          <div>{match.date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>

                        {/* Teams and score */}
                        <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
                          <span className={`text-sm text-right flex-1 truncate ${
                            match.homeTeam.toLowerCase().includes('dinamo') ? 'font-bold text-dinamo-red' : 'font-medium'
                          }`}>
                            {match.homeTeam}
                          </span>

                          {hasScore ? (
                            <span className="font-bold text-base bg-dinamo-blue text-white px-3 py-1 rounded-lg min-w-[60px] text-center">
                              {match.homeScore} - {match.awayScore}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-lg min-w-[60px] text-center">
                              vs
                            </span>
                          )}

                          <span className={`text-sm text-left flex-1 truncate ${
                            match.awayTeam.toLowerCase().includes('dinamo') ? 'font-bold text-dinamo-red' : 'font-medium'
                          }`}>
                            {match.awayTeam}
                          </span>
                        </div>

                        {/* Location */}
                        <div className="text-xs text-gray-400 w-24 shrink-0 text-right truncate hidden md:block">
                          {match.location || ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {sortedTeams.length === 0 && competition.matches.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-400 text-lg">Aceasta competitie nu are inca date disponibile.</p>
        </div>
      )}
    </div>
  )
}
