import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

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
