import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAthlete } from '@/lib/app-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  const auth = await requireAthlete(request)
  if ('error' in auth) return auth.error

  const { child, team } = auth

  if (!team) {
    return NextResponse.json({ error: 'No team assigned' }, { status: 404 })
  }

  const [coaches, teammates, pointsAgg] = await Promise.all([
    prisma.coach.findMany({
      where: { teamId: team.id },
      select: { id: true, name: true, photo: true },
    }),
    prisma.child.findMany({
      where: { teamId: team.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.points.groupBy({
      by: ['childId'],
      where: { child: { teamId: team.id } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
  ])

  // Build leaderboard
  const childIds = pointsAgg.map((p) => p.childId)
  const childNames = await prisma.child.findMany({
    where: { id: { in: childIds } },
    select: { id: true, name: true },
  })
  const nameMap = new Map(childNames.map((c) => [c.id, c.name]))

  const leaderboard = pointsAgg.map((p, index) => ({
    rank: index + 1,
    childId: p.childId,
    name: nameMap.get(p.childId) || 'Unknown',
    points: p._sum.amount || 0,
    isCurrentUser: p.childId === child.id,
  }))

  return NextResponse.json({
    data: {
      grupa: team.grupa,
      coaches,
      playerCount: teammates.length,
      teammates: teammates.map((t) => ({
        id: t.id,
        name: t.name,
        isCurrentUser: t.id === child.id,
      })),
      leaderboard,
    },
  })
}
