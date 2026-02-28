import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { childId: string; id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const record = await prisma.medicalRecord.findFirst({
    where: { id: params.id, childId: params.childId },
  })

  if (!record) {
    return NextResponse.json({ error: 'Inregistrare negasita' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const updated = await prisma.medicalRecord.update({
    where: { id: params.id },
    data: {
      resolved: body.resolved !== undefined ? Boolean(body.resolved) : undefined,
      returnDate: body.returnDate ? new Date(body.returnDate as string) : undefined,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { childId: string; id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const record = await prisma.medicalRecord.findFirst({
    where: { id: params.id, childId: params.childId },
  })

  if (!record) {
    return NextResponse.json({ error: 'Inregistrare negasita' }, { status: 404 })
  }

  await prisma.medicalRecord.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
