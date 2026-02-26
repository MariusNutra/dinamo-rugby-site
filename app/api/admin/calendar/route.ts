import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const events = await prisma.calendarEvent.findMany({
    include: { team: true },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { title, type, date, startTime, endTime, location, description, teamId } = body

  if (!title || !date) {
    return NextResponse.json({ error: 'Titlul si data sunt obligatorii' }, { status: 400 })
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title: String(title).slice(0, 200),
      type: type || 'event',
      date: new Date(date),
      startTime: startTime || null,
      endTime: endTime || null,
      location: location ? String(location).slice(0, 200) : null,
      description: description ? String(description).slice(0, 1000) : null,
      teamId: teamId ? Number(teamId) : null,
    },
    include: { team: true },
  })

  return NextResponse.json(event, { status: 201 })
}
