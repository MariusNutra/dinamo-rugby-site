import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const evaluation = await prisma.evaluation.findUnique({ where: { id: params.id } })
  if (!evaluation) {
    return NextResponse.json({ error: 'Evaluare negasita' }, { status: 404 })
  }

  await prisma.evaluation.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
