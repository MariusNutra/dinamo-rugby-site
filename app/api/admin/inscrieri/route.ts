import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const teamId = url.searchParams.get('teamId')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (teamId) where.teamId = Number(teamId)

  const registrations = await prisma.registration.findMany({
    where,
    include: { team: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(registrations)
}
