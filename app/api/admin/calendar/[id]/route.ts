import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { title, type, date, startTime, endTime, location, description, teamId } = body

  const event = await prisma.calendarEvent.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title: String(title).slice(0, 200) }),
      ...(type !== undefined && { type }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(location !== undefined && { location: location ? String(location).slice(0, 200) : null }),
      ...(description !== undefined && { description: description ? String(description).slice(0, 1000) : null }),
      ...(teamId !== undefined && { teamId: teamId ? Number(teamId) : null }),
    },
    include: { team: true },
  })

  return NextResponse.json(event)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  await prisma.calendarEvent.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
