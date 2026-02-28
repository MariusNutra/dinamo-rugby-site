import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get('teamId')
  const date = searchParams.get('date')
  const month = searchParams.get('month')
  const childId = searchParams.get('childId')

  const where: Record<string, unknown> = {}
  if (teamId) where.teamId = Number(teamId)
  if (childId) where.childId = childId
  if (date) {
    const d = new Date(date)
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    where.date = { gte: start, lt: end }
  } else if (month) {
    const [year, m] = month.split('-').map(Number)
    const start = new Date(year, m - 1, 1)
    const end = new Date(year, m, 1)
    where.date = { gte: start, lt: end }
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      child: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(attendances)
}
