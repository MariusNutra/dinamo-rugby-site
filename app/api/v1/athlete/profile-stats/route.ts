import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAthlete } from '@/lib/app-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  const auth = await requireAthlete(request)
  if ('error' in auth) return auth.error

  const childId = auth.child.id

  const [allAttendances, evaluations, pointsAgg, fitnessData] = await Promise.all([
    prisma.attendance.findMany({ where: { childId } }),
    prisma.evaluation.findMany({ where: { childId } }),
    prisma.points.aggregate({
      where: { childId },
      _sum: { amount: true },
    }),
    prisma.fitnessData.findMany({ where: { childId } }),
  ])

  // Attendance percent (all-time)
  const totalSessions = allAttendances.length
  const presentSessions = allAttendances.filter((a) => a.present).length
  const attendancePercent = totalSessions > 0
    ? Math.round((presentSessions / totalSessions) * 100)
    : 0

  // Average evaluation
  let averageEvaluation = 0
  if (evaluations.length > 0) {
    const total = evaluations.reduce(
      (sum, e) => sum + (e.physical + e.technical + e.tactical + e.mental + e.social) / 5,
      0
    )
    averageEvaluation = Math.round((total / evaluations.length) * 10) / 10
  }

  // Total points
  const totalPoints = pointsAgg._sum.amount || 0

  // Fitness aggregates
  let fitness = null
  if (fitnessData.length > 0) {
    const heartRates = fitnessData
      .map((f) => f.heartRateAvg)
      .filter((v): v is number => v !== null)
    const distances = fitnessData
      .map((f) => f.distance)
      .filter((v): v is number => v !== null)

    fitness = {
      sessionCount: fitnessData.length,
      avgHeartRate: heartRates.length > 0
        ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
        : null,
      totalDistance: distances.length > 0
        ? Math.round(distances.reduce((a, b) => a + b, 0) * 10) / 10
        : null,
    }
  }

  return NextResponse.json({
    data: {
      attendancePercent,
      averageEvaluation,
      totalPoints,
      fitness,
    },
  })
}
