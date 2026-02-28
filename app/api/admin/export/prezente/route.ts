import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const url = new URL(req.url)
  const teamId = url.searchParams.get('teamId')
  const month = url.searchParams.get('month') // YYYY-MM format

  if (!teamId || !month) {
    return NextResponse.json({ error: 'teamId si month obligatorii' }, { status: 400 })
  }

  const [year, m] = month.split('-').map(Number)
  const start = new Date(year, m - 1, 1)
  const end = new Date(year, m, 0, 23, 59, 59)

  const team = await prisma.team.findUnique({ where: { id: Number(teamId) } })
  if (!team) {
    return NextResponse.json({ error: 'Echipa negasita' }, { status: 404 })
  }

  const children = await prisma.child.findMany({
    where: { teamId: Number(teamId) },
    include: {
      attendances: {
        where: { date: { gte: start, lte: end } },
      },
    },
    orderBy: { name: 'asc' },
  })

  const records = children.map(c => ({
    name: c.name,
    dates: c.attendances.map(a => a.date.toISOString().split('T')[0]),
    presentDates: c.attendances.filter(a => a.present).map(a => a.date.toISOString().split('T')[0]),
  }))

  const monthNames = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie']

  return NextResponse.json({
    team: team.grupa,
    month: `${monthNames[m - 1]} ${year}`,
    records,
  })
}
