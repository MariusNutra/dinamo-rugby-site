import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function GET() {
  const authz = await requirePermission('shop.manage')
  if (authz.error) return authz.error

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: { select: { name: true, image: true } } } } },
  })

  return NextResponse.json(orders)
}
