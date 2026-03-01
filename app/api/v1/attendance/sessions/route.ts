import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCoach } from '@/lib/app-auth'
import { generateQRToken } from '@/lib/qr'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(request: NextRequest) {
  const auth = await requireCoach(request)
  if ('error' in auth) return auth.error

  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  const session = await prisma.attendanceSession.create({
    data: {
      teamId: auth.team.id,
      qrToken: generateQRToken(),
      expiresAt: endOfDay,
    },
  })

  const children = await prisma.child.findMany({
    where: { teamId: auth.team.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({
    data: {
      id: session.id,
      qrToken: session.qrToken,
      teamId: auth.team.id,
      teamName: auth.team.grupa,
      expiresAt: session.expiresAt.toISOString(),
      children,
    },
  })
}

export async function GET(request: NextRequest) {
  const auth = await requireCoach(request)
  if ('error' in auth) return auth.error

  const url = new URL(request.url)
  const teamId = url.searchParams.get('teamId')
    ? parseInt(url.searchParams.get('teamId')!)
    : auth.team.id
  const activeOnly = url.searchParams.get('active') === 'true'

  if (teamId !== auth.team.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const where: Record<string, unknown> = { teamId }
  if (activeOnly) {
    where.expiresAt = { gt: new Date() }
  }

  const sessions = await prisma.attendanceSession.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    data: sessions.map((s) => ({
      id: s.id,
      qrToken: s.qrToken,
      teamId: s.teamId,
      expiresAt: s.expiresAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
    })),
  })
}
