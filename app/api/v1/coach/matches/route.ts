import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCoach } from '@/lib/app-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  const auth = await requireCoach(request)
  if ('error' in auth) return auth.error

  const matches = await prisma.match.findMany({
    where: { category: auth.team.grupa },
    include: { competition: { select: { name: true } } },
    orderBy: { date: 'desc' },
  })

  const now = new Date()

  return NextResponse.json({
    data: matches.map((m) => {
      const matchDate = new Date(m.date)
      return {
        id: m.id,
        category: m.category,
        matchType: m.matchType,
        round: m.round,
        date: matchDate.toISOString().split('T')[0],
        time: matchDate.toTimeString().slice(0, 5),
        location: m.location,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status: matchDate < now ? 'finished' : 'scheduled',
        competitionName: m.competition?.name || null,
      }
    }),
  })
}
