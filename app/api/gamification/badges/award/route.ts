import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { badgeId, childId } = body

  if (!badgeId || !childId) {
    return NextResponse.json({ error: 'badgeId si childId sunt obligatorii' }, { status: 400 })
  }

  // Verify badge exists
  const badge = await prisma.badge.findUnique({ where: { id: badgeId } })
  if (!badge) {
    return NextResponse.json({ error: 'Badge negasit' }, { status: 404 })
  }

  // Verify child exists
  const child = await prisma.child.findUnique({ where: { id: childId } })
  if (!child) {
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  // Check if already awarded
  const existing = await prisma.athleteBadge.findUnique({
    where: { childId_badgeId: { childId, badgeId } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Badge-ul este deja acordat acestui sportiv' }, { status: 409 })
  }

  const athleteBadge = await prisma.athleteBadge.create({
    data: { childId, badgeId },
    include: { badge: true, child: true },
  })

  return NextResponse.json({
    success: true,
    athleteBadge: {
      id: athleteBadge.id,
      childName: athleteBadge.child.name,
      badgeName: athleteBadge.badge.name,
      badgeIcon: athleteBadge.badge.icon,
      earnedAt: athleteBadge.earnedAt,
    },
  }, { status: 201 })
}
