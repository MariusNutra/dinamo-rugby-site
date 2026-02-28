import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAppToken } from '@/lib/app-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  const appUser = verifyAppToken(request)
  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const childId = url.searchParams.get('childId')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)

  const where: Record<string, unknown> = {}
  if (childId) where.childId = childId

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({
    data: payments.map((p) => ({
      id: p.id,
      childId: p.childId,
      amount: p.amount,
      type: p.type,
      status: p.status,
      dueDate: p.createdAt.toISOString(),
      paidDate: p.status === 'paid' ? p.updatedAt.toISOString() : null,
    })),
  })
}
