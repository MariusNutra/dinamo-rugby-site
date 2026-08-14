import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveCoachTeam } from '@/lib/coach-teams'

export async function GET(req: NextRequest) {
  const resolved = await resolveCoachTeam(req.nextUrl.searchParams.get('teamId'))
  if (!resolved) {
    return NextResponse.json({ data: [] })
  }

  const { teamId } = resolved

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [children, todayAttendances] = await Promise.all([
    prisma.child.findMany({ where: { teamId }, orderBy: { name: 'asc' } }),
    prisma.attendance.findMany({
      where: { teamId, date: { gte: today, lt: tomorrow } },
    }),
  ])

  const attendanceMap = new Map(
    todayAttendances.map(a => [a.childId, a.present ? 'present' : 'absent'])
  )

  return NextResponse.json({
    data: children.map(c => ({
      id: c.id,
      name: c.name,
      birthYear: c.birthYear,
      attendanceToday: attendanceMap.get(c.id) || 'unmarked',
    })),
  })
}
