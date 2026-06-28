import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const authz = await requirePermission('parents.view')
  if (authz.error) return authz.error

  const { childId } = await params

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { signatureData: true },
  })

  if (!child || !child.signatureData) {
    return NextResponse.json({ error: 'Semnatura nu exista' }, { status: 404 })
  }

  return NextResponse.json({ signatureData: child.signatureData })
}
