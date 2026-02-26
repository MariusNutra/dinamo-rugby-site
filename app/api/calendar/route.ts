import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const month = url.searchParams.get('month')
  const year = url.searchParams.get('year')
  const teamId = url.searchParams.get('teamId')

  const now = new Date()
  const m = month ? parseInt(month) - 1 : now.getMonth()
  const y = year ? parseInt(year) : now.getFullYear()

  const start = new Date(y, m, 1)
  const end = new Date(y, m + 1, 0, 23, 59, 59)

  const where: Record<string, unknown> = {
    date: { gte: start, lte: end },
  }
  if (teamId) where.teamId = Number(teamId)

  // Get calendar events
  const events = await prisma.calendarEvent.findMany({
    where,
    include: { team: true },
    orderBy: { date: 'asc' },
  })

  // Get matches for this month
  const matches = await prisma.match.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(teamId ? { category: (await prisma.team.findUnique({ where: { id: Number(teamId) } }))?.grupa } : {}),
    },
    orderBy: { date: 'asc' },
  })

  // Get training sessions (recurring - map to dates in this month)
  const dayMap: Record<string, number> = { Luni: 1, Marti: 2, Miercuri: 3, Joi: 4, Vineri: 5, Sambata: 6, Duminica: 0 }
  const trainings = await prisma.trainingSession.findMany({
    ...(teamId ? { where: { grupa: (await prisma.team.findUnique({ where: { id: Number(teamId) } }))?.grupa } } : {}),
  })

  // Build unified event list
  const calendarItems: { id: string | number; title: string; type: string; date: string; startTime: string | null; endTime: string | null; location: string | null; description: string | null; team: string | null; source: string }[] = [
    ...events.map(e => ({
      id: e.id,
      title: e.title,
      type: e.type,
      date: e.date.toISOString(),
      startTime: e.startTime,
      endTime: e.endTime,
      location: e.location,
      description: e.description,
      team: e.team?.grupa || null,
      source: 'event',
    })),
    ...matches.map(m => ({
      id: m.id,
      title: `${m.homeTeam} vs ${m.awayTeam}`,
      type: 'match',
      date: m.date.toISOString(),
      startTime: null,
      endTime: null,
      location: m.location,
      description: m.round ? `${m.round} - ${m.category}` : m.category,
      team: m.category,
      source: 'match',
    })),
  ]

  // Add training sessions as recurring events
  for (const t of trainings) {
    const dayNum = dayMap[t.day]
    if (dayNum === undefined) continue
    const d = new Date(start)
    while (d <= end) {
      if (d.getDay() === dayNum) {
        calendarItems.push({
          id: `training-${t.id}-${d.toISOString().split('T')[0]}`,
          title: `Antrenament ${t.grupa}`,
          type: 'training',
          date: new Date(d).toISOString(),
          startTime: t.startTime,
          endTime: t.endTime,
          location: t.location,
          description: t.coachName ? `Antrenor: ${t.coachName}` : null,
          team: t.grupa,
          source: 'training',
        })
      }
      d.setDate(d.getDate() + 1)
    }
  }

  return NextResponse.json(calendarItems)
}
