import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateICalendar } from '@/lib/ical'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const teamIdStr = searchParams.get('teamId')
    const monthsAhead = parseInt(searchParams.get('months') || '3', 10)

    const now = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + monthsAhead)

    // Fetch calendar events
    const where: Record<string, unknown> = {
      date: { gte: now, lte: endDate },
    }
    if (teamIdStr) {
      where.teamId = parseInt(teamIdStr, 10)
    }

    const calendarEvents = await prisma.calendarEvent.findMany({
      where,
      include: { team: { select: { grupa: true } } },
      orderBy: { date: 'asc' },
    })

    // Also fetch matches
    const matches = await prisma.match.findMany({
      where: {
        date: { gte: now, lte: endDate },
      },
      orderBy: { date: 'asc' },
    })

    // Convert to iCal events
    const icalEvents = [
      ...calendarEvents.map(ev => ({
        uid: `event-${ev.id}@dinamorugby.ro`,
        summary: ev.title,
        description: ev.description || undefined,
        location: ev.location || undefined,
        dtstart: ev.date,
        dtend: ev.endTime ? (() => {
          const d = new Date(ev.date)
          const [h, m] = ev.endTime.split(':').map(Number)
          d.setHours(h, m)
          return d
        })() : undefined,
      })),
      ...matches.map(m => ({
        uid: `match-${m.id}@dinamorugby.ro`,
        summary: `${m.homeTeam} vs ${m.awayTeam}`,
        description: `${m.category} — ${m.round || m.matchType}${m.notes ? '\n' + m.notes : ''}`,
        location: m.location || undefined,
        dtstart: m.date,
      })),
    ]

    const icalContent = generateICalendar(icalEvents)

    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="dinamo-rugby-calendar.ics"',
      },
    })
  } catch (error) {
    console.error('Failed to export calendar:', error)
    return NextResponse.json({ error: 'Eroare la export' }, { status: 500 })
  }
}
