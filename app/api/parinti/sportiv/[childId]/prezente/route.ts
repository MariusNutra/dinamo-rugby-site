import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function GET(req: NextRequest, { params }: { params: { childId: string } }) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const child = await prisma.child.findUnique({ where: { id: params.childId } })
  if (!child || child.parentId !== parentId) {
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')

  let dateFilter: Record<string, Date> | undefined
  if (month) {
    const [year, m] = month.split('-').map(Number)
    dateFilter = {
      gte: new Date(year, m - 1, 1),
      lt: new Date(year, m, 1),
    }
  }

  const attendances = await prisma.attendance.findMany({
    where: {
      childId: params.childId,
      ...(dateFilter ? { date: dateFilter } : {}),
    },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(attendances)
}
