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
  const childId = child.id

  const [allBadges, earnedBadges, totalPointsAgg] = await Promise.all([
    prisma.badge.findMany({ where: { active: true }, orderBy: { category: 'asc' } }),
    prisma.athleteBadge.findMany({
      where: { childId },
      select: { badgeId: true, earnedAt: true },
    }),
    prisma.points.aggregate({
      where: { childId },
      _sum: { amount: true },
    }),
  ])

  const earnedMap = new Map(
    earnedBadges.map((b) => [b.badgeId, b.earnedAt])
  )

  const totalPoints = totalPointsAgg._sum.amount || 0

  // Compute rank within team
  let rank: number | null = null
  if (team) {
    const teamPoints = await prisma.points.groupBy({
      by: ['childId'],
      where: { child: { teamId: team.id } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    })
    const idx = teamPoints.findIndex((p) => p.childId === childId)
    rank = idx >= 0 ? idx + 1 : null
  }

  return NextResponse.json({
    data: {
      totalPoints,
      rank,
      badges: allBadges.map((b) => ({
        id: b.id,
        name: b.name,
        icon: b.icon,
        description: b.description,
        category: b.category,
        earned: earnedMap.has(b.id),
        earnedAt: earnedMap.get(b.id)?.toISOString() || null,
      })),
    },
  })
}
