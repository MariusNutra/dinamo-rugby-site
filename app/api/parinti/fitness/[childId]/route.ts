import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function GET(req: NextRequest, { params }: { params: { childId: string } }) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const child = await prisma.child.findUnique({ where: { id: params.childId } })
  if (!child || child.parentId !== parentId) {
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const where: Record<string, unknown> = { childId: params.childId }
  if (from || to) {
    const dateFilter: Record<string, Date> = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to)
    where.date = dateFilter
  }

  const data = await prisma.fitnessData.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 100,
  })

  // Also compute 30-day summary
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentEntries = data.filter(e => new Date(e.date) >= thirtyDaysAgo)
  const sessionCount = recentEntries.length

  const hrValues = recentEntries.filter(e => e.heartRateAvg != null).map(e => e.heartRateAvg!)
  const avgHeartRate = hrValues.length > 0 ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : null

  const totalDistance = recentEntries.reduce((sum, e) => sum + (e.distance || 0), 0)

  const sleepValues = recentEntries.filter(e => e.sleepHours != null).map(e => e.sleepHours!)
  const avgSleep = sleepValues.length > 0 ? Math.round((sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length) * 10) / 10 : null

  const totalCalories = recentEntries.reduce((sum, e) => sum + (e.calories || 0), 0)
  const totalSprints = recentEntries.reduce((sum, e) => sum + (e.sprintCount || 0), 0)

  return NextResponse.json({
    entries: data,
    summary: {
      avgHeartRate,
      totalDistance,
      avgSleep,
      totalCalories,
      totalSprints,
      sessionCount,
    },
  })
}
