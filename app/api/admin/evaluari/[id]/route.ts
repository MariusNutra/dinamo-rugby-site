import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authz = await requirePermission('evaluations.manage')
  if (authz.error) return authz.error

  const evaluation = await prisma.evaluation.findUnique({ where: { id: params.id } })
  if (!evaluation) {
    return NextResponse.json({ error: 'Evaluare negasita' }, { status: 404 })
  }

  await prisma.evaluation.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
