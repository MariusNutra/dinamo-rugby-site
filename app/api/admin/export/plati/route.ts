import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const payments = await prisma.payment.findMany({
    where,
    include: { parent: true, child: true },
    orderBy: { createdAt: 'desc' },
  })

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)

  return NextResponse.json({
    title: 'Raport Plati / Cotizatii',
    payments: payments.map(p => ({
      name: p.parent?.name || 'N/A',
      child: p.child?.name || 'N/A',
      amount: p.amount,
      type: p.type,
      status: p.status,
      date: p.createdAt.toISOString(),
    })),
    totalPaid,
    totalPending,
  })
}
