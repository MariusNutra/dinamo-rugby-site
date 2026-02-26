import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const childId = searchParams.get('childId')
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const teamId = searchParams.get('teamId')

  const where: Record<string, unknown> = {}

  if (childId) where.childId = childId
  if (status) where.status = status
  if (type) where.type = type
  if (teamId) {
    where.child = { teamId: parseInt(teamId) }
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      parent: { select: { name: true, email: true } },
      child: { select: { name: true, birthYear: true, team: { select: { grupa: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json(payments)
}
