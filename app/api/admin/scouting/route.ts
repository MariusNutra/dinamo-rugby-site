import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated, getAuthUser } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const reports = await prisma.scoutingReport.findMany({
    include: {
      _count: {
        select: { prospects: true },
      },
    },
    orderBy: { eventDate: 'desc' },
  })

  return NextResponse.json(reports)
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { eventName, eventDate, location, notes } = body

  if (!eventName || !eventDate) {
    return NextResponse.json(
      { error: 'Numele evenimentului si data sunt obligatorii' },
      { status: 400 }
    )
  }

  const user = await getAuthUser()

  const report = await prisma.scoutingReport.create({
    data: {
      eventName: String(eventName).slice(0, 300),
      eventDate: new Date(eventDate),
      location: location ? String(location).slice(0, 300) : null,
      notes: notes ? String(notes).slice(0, 5000) : null,
      createdBy: user?.username || null,
    },
    include: {
      _count: {
        select: { prospects: true },
      },
    },
  })

  return NextResponse.json(report, { status: 201 })
}
