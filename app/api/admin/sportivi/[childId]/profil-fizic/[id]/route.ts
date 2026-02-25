import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: { childId: string; id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const profile = await prisma.physicalProfile.findFirst({
    where: { id: params.id, childId: params.childId },
  })

  if (!profile) {
    return NextResponse.json({ error: 'Profil negasit' }, { status: 404 })
  }

  await prisma.physicalProfile.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
