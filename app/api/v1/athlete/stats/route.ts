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

  // Monthly attendance
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const monthAttendances = await prisma.attendance.findMany({
    where: {
      childId,
      date: { gte: monthStart, lt: monthEnd },
    },
  })

  const totalSessions = monthAttendances.length
  const presentSessions = monthAttendances.filter((a) => a.present).length
  const monthlyAttendance = totalSessions > 0
    ? Math.round((presentSessions / totalSessions) * 100)
    : 0

  // Average evaluation
  const evaluations = await prisma.evaluation.findMany({
    where: { childId },
  })

  let averageEvaluation = 0
  if (evaluations.length > 0) {
    const total = evaluations.reduce(
      (sum, e) => sum + (e.physical + e.technical + e.tactical + e.mental + e.social) / 5,
      0
    )
    averageEvaluation = Math.round((total / evaluations.length) * 10) / 10
  }

  // Total points
  const pointsAgg = await prisma.points.aggregate({
    where: { childId },
    _sum: { amount: true },
  })
  const totalPoints = pointsAgg._sum.amount || 0

  // Team info
  const coach = team
    ? await prisma.coach.findFirst({ where: { teamId: team.id } })
    : null

  return NextResponse.json({
    data: {
      monthlyAttendance,
      averageEvaluation,
      totalPoints,
      teamName: team?.grupa || null,
      teamCoach: coach?.name || null,
    },
  })
}
