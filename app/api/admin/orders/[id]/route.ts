import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params
  const { status } = await req.json()

  const validStatuses = ['noua', 'platita', 'procesare', 'expediat', 'livrat', 'anulat']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Status invalid' }, { status: 400 })
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { items: true },
  })

  return NextResponse.json(order)
}
