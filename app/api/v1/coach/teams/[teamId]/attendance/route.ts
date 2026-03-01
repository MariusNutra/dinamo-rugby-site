import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCoach } from '@/lib/app-auth'
import { generateQRToken } from '@/lib/qr'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const auth = await requireCoach(request)
  if ('error' in auth) return auth.error

  const teamId = parseInt(params.teamId)
  if (auth.team.id !== teamId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const dateParam = url.searchParams.get('date')
  const targetDate = dateParam ? new Date(dateParam) : new Date()
  targetDate.setHours(0, 0, 0, 0)
  const nextDay = new Date(targetDate)
  nextDay.setDate(nextDay.getDate() + 1)

  // Find or create session for this team + date
  let session = await prisma.attendanceSession.findFirst({
    where: {
      teamId,
      date: { gte: targetDate, lt: nextDay },
    },
  })

  if (!session) {
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)
    session = await prisma.attendanceSession.create({
      data: {
        teamId,
        qrToken: generateQRToken(),
        expiresAt: endOfDay,
        date: targetDate,
      },
    })
  }

  // Get all children and their attendance for that date
  const children = await prisma.child.findMany({
    where: { teamId },
    orderBy: { name: 'asc' },
  })

  const attendances = await prisma.attendance.findMany({
    where: {
      teamId,
      date: { gte: targetDate, lt: nextDay },
    },
  })

  const attendanceMap = new Map(
    attendances.map((a) => [a.childId, a.present ? 'present' : 'absent'])
  )

  return NextResponse.json({
    data: {
      sessionId: session.id,
      date: targetDate.toISOString(),
      players: children.map((c) => ({
        childId: c.id,
        name: c.name,
        status: attendanceMap.get(c.id) || 'unmarked',
      })),
    },
  })
}
