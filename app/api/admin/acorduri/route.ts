import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const teamId = req.nextUrl.searchParams.get('teamId')
  const status = req.nextUrl.searchParams.get('status')

  const where: Record<string, unknown> = {}

  if (teamId) {
    where.teamId = Number(teamId)
  }

  if (status === 'signed') {
    where.photoConsentDate = { not: null }
  } else if (status === 'unsigned') {
    where.photoConsentDate = null
  }

  const children = await prisma.child.findMany({
    where,
    include: {
      parent: { select: { name: true, email: true, phone: true } },
      team: { select: { id: true, grupa: true } },
    },
    orderBy: [{ team: { grupa: 'asc' } }, { name: 'asc' }],
  })

  const totalChildren = await prisma.child.count()
  const signedCount = await prisma.child.count({
    where: { photoConsentDate: { not: null } },
  })

  return NextResponse.json({
    children: children.map(c => ({
      id: c.id,
      name: c.name,
      birthYear: c.birthYear,
      teamName: c.team?.grupa ?? '—',
      teamId: c.teamId,
      photoConsent: c.photoConsent,
      photoConsentWA: c.photoConsentWA,
      photoConsentDate: c.photoConsentDate,
      parentName: c.parent.name,
      parentEmail: c.parent.email,
      parentPhone: c.parent.phone,
    })),
    stats: {
      total: totalChildren,
      signed: signedCount,
    },
  })
}
