import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const competition = await prisma.competition.findUnique({
    where: { id: params.id },
    include: {
      teams: true,
      matches: true,
    },
  })

  if (!competition) {
    return NextResponse.json({ error: 'Competiția nu a fost găsită' }, { status: 404 })
  }

  // Only consider matches that have scores (both homeScore and awayScore are not null)
  const completedMatches = competition.matches.filter(
    m => m.homeScore !== null && m.awayScore !== null
  )

  // Calculate standings for each team
  for (const team of competition.teams) {
    let played = 0
    let won = 0
    let drawn = 0
    let lost = 0
    let goalsFor = 0
    let goalsAgainst = 0

    for (const match of completedMatches) {
      const isHome = match.homeTeam === team.teamName
      const isAway = match.awayTeam === team.teamName

      if (!isHome && !isAway) continue

      played++

      const teamGoals = isHome ? match.homeScore! : match.awayScore!
      const opponentGoals = isHome ? match.awayScore! : match.homeScore!

      goalsFor += teamGoals
      goalsAgainst += opponentGoals

      if (teamGoals > opponentGoals) {
        won++
      } else if (teamGoals === opponentGoals) {
        drawn++
      } else {
        lost++
      }
    }

    const points = won * 3 + drawn * 1

    await prisma.competitionTeam.update({
      where: { id: team.id },
      data: {
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        points,
      },
    })
  }

  // Return updated competition with sorted standings
  const updated = await prisma.competition.findUnique({
    where: { id: params.id },
    include: {
      teams: {
        orderBy: [
          { points: 'desc' },
          { goalsFor: 'desc' },
        ],
      },
      matches: {
        orderBy: { date: 'desc' },
      },
    },
  })

  // Sort teams properly (points desc, goal diff desc, goalsFor desc)
  if (updated) {
    updated.teams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      const gdA = a.goalsFor - a.goalsAgainst
      const gdB = b.goalsFor - b.goalsAgainst
      if (gdB !== gdA) return gdB - gdA
      return b.goalsFor - a.goalsFor
    })
  }

  return NextResponse.json(updated)
}
