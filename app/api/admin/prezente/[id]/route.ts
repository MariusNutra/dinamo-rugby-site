import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const attendance = await prisma.attendance.findUnique({ where: { id: params.id } })
  if (!attendance) {
    return NextResponse.json({ error: 'Prezenta negasita' }, { status: 404 })
  }

  await prisma.attendance.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
