import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { childId: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const entries = await prisma.fitnessData.findMany({
    where: {
      childId: params.childId,
      date: { gte: thirtyDaysAgo },
    },
  })

  const sessionCount = entries.length

  if (sessionCount === 0) {
    return NextResponse.json({
      avgHeartRate: null,
      totalDistance: 0,
      avgSleep: null,
      totalCalories: 0,
      totalSprints: 0,
      sessionCount: 0,
    })
  }

  const hrValues = entries.filter(e => e.heartRateAvg != null).map(e => e.heartRateAvg!)
  const avgHeartRate = hrValues.length > 0 ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : null

  const totalDistance = entries.reduce((sum, e) => sum + (e.distance || 0), 0)

  const sleepValues = entries.filter(e => e.sleepHours != null).map(e => e.sleepHours!)
  const avgSleep = sleepValues.length > 0 ? Math.round((sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length) * 10) / 10 : null

  const totalCalories = entries.reduce((sum, e) => sum + (e.calories || 0), 0)
  const totalSprints = entries.reduce((sum, e) => sum + (e.sprintCount || 0), 0)

  return NextResponse.json({
    avgHeartRate,
    totalDistance,
    avgSleep,
    totalCalories,
    totalSprints,
    sessionCount,
  })
}
