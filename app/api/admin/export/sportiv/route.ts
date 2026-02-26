import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const url = new URL(req.url)
  const childId = url.searchParams.get('childId')
  if (!childId) {
    return NextResponse.json({ error: 'childId obligatoriu' }, { status: 400 })
  }

  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: {
      parent: true,
      team: true,
      evaluations: { orderBy: { date: 'desc' } },
      attendances: true,
    },
  })

  if (!child) {
    return NextResponse.json({ error: 'Sportiv negasit' }, { status: 404 })
  }

  const totalAttendance = child.attendances.length
  const presentCount = child.attendances.filter(a => a.present).length

  return NextResponse.json({
    name: child.name,
    birthYear: child.birthYear,
    team: child.team?.grupa || 'Fara echipa',
    parent: child.parent.name,
    evaluations: child.evaluations.map(e => ({
      date: e.date.toISOString(),
      period: e.period,
      physical: e.physical,
      technical: e.technical,
      tactical: e.tactical,
      mental: e.mental,
      social: e.social,
    })),
    attendanceStats: {
      total: totalAttendance,
      present: presentCount,
      percent: totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0,
    },
  })
}
