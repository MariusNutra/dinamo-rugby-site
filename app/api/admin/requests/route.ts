import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated, getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const status = req.nextUrl.searchParams.get('status')
  const type = req.nextUrl.searchParams.get('type')

  const where: Record<string, unknown> = {}
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    where.status = status
  }
  if (type && ['absenta', 'transfer', 'echipament', 'alta'].includes(type)) {
    where.type = type
  }

  const requests = await prisma.request.findMany({
    where,
    include: {
      parent: { select: { id: true, name: true, email: true } },
      child: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get counts for stats
  const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.request.count({ where: { status: 'pending' } }),
    prisma.request.count({ where: { status: 'approved' } }),
    prisma.request.count({ where: { status: 'rejected' } }),
  ])

  return NextResponse.json({
    requests,
    stats: {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    },
  })
}

export async function PATCH(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const user = await getAuthUser()

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { requestId, action, response } = body

  if (!requestId || typeof requestId !== 'string') {
    return NextResponse.json({ error: 'ID cerere lipsa' }, { status: 400 })
  }

  if (!action || !['approve', 'reject'].includes(action as string)) {
    return NextResponse.json({ error: 'Actiune invalida' }, { status: 400 })
  }

  const existing = await prisma.request.findUnique({ where: { id: requestId } })
  if (!existing) {
    return NextResponse.json({ error: 'Cererea nu a fost gasita' }, { status: 404 })
  }

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      status: action === 'approve' ? 'approved' : 'rejected',
      response: response ? (response as string).trim() : null,
      reviewedBy: user?.username || 'admin',
      reviewedAt: new Date(),
    },
    include: {
      parent: { select: { id: true, name: true, email: true } },
      child: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(updated)
}
