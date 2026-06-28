import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authz = await requirePermission('attendance.manage')
  if (authz.error) return authz.error

  const attendance = await prisma.attendance.findUnique({ where: { id: params.id } })
  if (!attendance) {
    return NextResponse.json({ error: 'Prezenta negasita' }, { status: 404 })
  }

  await prisma.attendance.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
