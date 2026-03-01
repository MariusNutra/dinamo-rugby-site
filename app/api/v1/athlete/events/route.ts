import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAthlete } from '@/lib/app-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  const auth = await requireAthlete(request)
  if ('error' in auth) return auth.error

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)

  const events = await prisma.calendarEvent.findMany({
    where: {
      date: { gte: new Date() },
      OR: [{ teamId: auth.team?.id ?? undefined }, { teamId: null }],
    },
    orderBy: { date: 'asc' },
    take: limit,
  })

  return NextResponse.json({
    data: events.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      date: e.date.toISOString(),
      startTime: e.startTime,
      endTime: e.endTime,
      location: e.location,
      description: e.description,
    })),
  })
}
