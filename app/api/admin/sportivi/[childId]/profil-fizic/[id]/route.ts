import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ childId: string; id: string }> }
) {
  const params = await props.params;
  const authz = await requirePermission('athletes.manage')
  if (authz.error) return authz.error

  const profile = await prisma.physicalProfile.findFirst({
    where: { id: params.id, childId: params.childId },
  })

  if (!profile) {
    return NextResponse.json({ error: 'Profil negasit' }, { status: 404 })
  }

  await prisma.physicalProfile.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
