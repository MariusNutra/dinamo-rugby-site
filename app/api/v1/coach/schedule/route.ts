import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCoach } from '@/lib/app-auth'
import { trainingOccurrences } from '@/lib/training-occurrences'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  const auth = await requireCoach(request)
  if ('error' in auth) return auth.error

  if (!auth.team) {
    return NextResponse.json({ data: [] })
  }

  const now = new Date()
  const daysParam = parseInt(new URL(request.url).searchParams.get('days') || '28')
  const days = Math.min(Math.max(1, isNaN(daysParam) ? 28 : daysParam), 90)

  const events = await prisma.calendarEvent.findMany({
    where: {
      date: { gte: now },
      OR: [{ teamId: auth.team.id }, { teamId: null }],
    },
    orderBy: { date: 'asc' },
  })

  // Antrenamentele saptamanale nu stau in calendar; fara ele, programul
  // antrenorului arata doar meciurile.
  const trainings = await trainingOccurrences(auth.team.grupa, days, now)

  const data = [
    ...events.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      date: e.date.toISOString(),
      startTime: e.startTime,
      endTime: e.endTime,
      location: e.location,
      description: e.description,
    })),
    ...trainings.map((t) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      date: t.date,
      startTime: t.startTime,
      endTime: t.endTime,
      location: t.location,
      description: t.description,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({ data })
}
