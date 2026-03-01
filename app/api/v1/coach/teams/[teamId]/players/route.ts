import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCoach } from '@/lib/app-auth'

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

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const children = await prisma.child.findMany({
    where: { teamId },
    orderBy: { name: 'asc' },
  })

  const todayAttendances = await prisma.attendance.findMany({
    where: {
      teamId,
      date: { gte: today, lt: tomorrow },
    },
  })

  const attendanceMap = new Map(
    todayAttendances.map((a) => [a.childId, a.present ? 'present' : 'absent'])
  )

  return NextResponse.json({
    data: children.map((c) => ({
      id: c.id,
      name: c.name,
      teamName: auth.team.grupa,
      attendanceStatus: attendanceMap.get(c.id) || 'unmarked',
    })),
  })
}
