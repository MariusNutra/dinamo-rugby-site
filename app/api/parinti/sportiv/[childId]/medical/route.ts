import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function GET(req: NextRequest, { params }: { params: { childId: string } }) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const child = await prisma.child.findUnique({ where: { id: params.childId } })
  if (!child || child.parentId !== parentId) {
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  const records = await prisma.medicalRecord.findMany({
    where: { childId: params.childId },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(records)
}
