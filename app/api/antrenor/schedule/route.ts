import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCoachId } from '@/lib/coach-auth'

export async function GET() {
  const coachId = await getCoachId()
  if (!coachId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const coach = await prisma.coach.findUnique({ where: { id: coachId } })
  if (!coach) {
    return NextResponse.json({ error: 'Antrenor negasit' }, { status: 404 })
  }

  if (!coach.teamId) {
    return NextResponse.json({ data: [] })
  }

  const events = await prisma.calendarEvent.findMany({
    where: {
      date: { gte: new Date() },
      OR: [{ teamId: coach.teamId }, { teamId: null }],
    },
    orderBy: { date: 'asc' },
    take: 10,
  })

  return NextResponse.json({
    data: events.map(e => ({
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
