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

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const children = await prisma.child.findMany({
    where: { teamId: coach.teamId },
    orderBy: { name: 'asc' },
  })

  const todayAttendances = await prisma.attendance.findMany({
    where: {
      teamId: coach.teamId,
      date: { gte: today, lt: tomorrow },
    },
  })

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
