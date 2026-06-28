import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCoachId } from '@/lib/coach-auth'

export async function GET() {
  const coachId = await getCoachId()
  if (!coachId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    include: { team: true },
  })
  if (!coach) {
    return NextResponse.json({ error: 'Antrenor negasit' }, { status: 404 })
  }

  if (!coach.team) {
    return NextResponse.json({ data: [] })
  }

  const matches = await prisma.match.findMany({
    where: { category: coach.team.grupa },
    include: { competition: { select: { name: true } } },
    orderBy: { date: 'desc' },
    take: 20,
  })

  const now = new Date()

  return NextResponse.json({
    data: matches.map(m => {
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
