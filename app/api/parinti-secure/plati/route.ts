import { NextResponse } from 'next/server'
import { getParentId } from '@/lib/parent-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const payments = await prisma.payment.findMany({
    where: { parentId },
    include: {
      child: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(payments)
}
