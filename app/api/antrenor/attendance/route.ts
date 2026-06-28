import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCoachId } from '@/lib/coach-auth'

export async function GET(req: NextRequest) {
  const coachId = await getCoachId()
  if (!coachId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const coach = await prisma.coach.findUnique({ where: { id: coachId } })
  if (!coach || !coach.teamId) {
    return NextResponse.json({ error: 'Nu esti asignat la o echipa' }, { status: 400 })
  }

  const dateParam = req.nextUrl.searchParams.get('date')
  const targetDate = dateParam ? new Date(dateParam) : new Date()
  targetDate.setHours(0, 0, 0, 0)
  const nextDay = new Date(targetDate)
  nextDay.setDate(nextDay.getDate() + 1)

  const children = await prisma.child.findMany({
    where: { teamId: coach.teamId },
    orderBy: { name: 'asc' },
  })

  const attendances = await prisma.attendance.findMany({
    where: {
      teamId: coach.teamId,
      date: { gte: targetDate, lt: nextDay },
    },
  })

  const attendanceMap = new Map(
    attendances.map(a => [a.childId, { present: a.present, id: a.id }])
  )

  return NextResponse.json({
    date: targetDate.toISOString().split('T')[0],
    players: children.map(c => ({
      childId: c.id,
      name: c.name,
      status: attendanceMap.has(c.id)
        ? (attendanceMap.get(c.id)!.present ? 'present' : 'absent')
        : 'unmarked',
    })),
  })
}

export async function POST(req: NextRequest) {
  const coachId = await getCoachId()
  if (!coachId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const coach = await prisma.coach.findUnique({ where: { id: coachId } })
  if (!coach || !coach.teamId) {
    return NextResponse.json({ error: 'Nu esti asignat la o echipa' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { date, attendances } = body as {
    date?: string
    attendances?: Array<{ childId: string; present: boolean }>
  }

  if (!date || !attendances || !Array.isArray(attendances)) {
    return NextResponse.json({ error: 'Campuri obligatorii: date, attendances' }, { status: 400 })
  }

  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  // Verify all children belong to the coach's team
  const teamChildren = await prisma.child.findMany({
    where: { teamId: coach.teamId },
    select: { id: true },
  })
  const validIds = new Set(teamChildren.map(c => c.id))

  for (const att of attendances) {
    if (!validIds.has(att.childId)) {
      return NextResponse.json({ error: `Sportivul ${att.childId} nu face parte din echipa ta.` }, { status: 403 })
    }
  }

  // Upsert attendance records
  const nextDay = new Date(targetDate)
  nextDay.setDate(nextDay.getDate() + 1)

  for (const att of attendances) {
    const existing = await prisma.attendance.findFirst({
      where: {
        childId: att.childId,
        teamId: coach.teamId,
        date: { gte: targetDate, lt: nextDay },
      },
    })

    if (existing) {
      await prisma.attendance.update({
        where: { id: existing.id },
        data: { present: att.present },
      })
    } else {
      await prisma.attendance.create({
        data: {
          childId: att.childId,
          teamId: coach.teamId,
          date: targetDate,
          type: 'antrenament',
          present: att.present,
        },
      })
    }
  }

  return NextResponse.json({ success: true, count: attendances.length })
}
