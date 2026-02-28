import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const data = await req.json()

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.photo !== undefined) updateData.photo = data.photo || null
  if (data.phone !== undefined) updateData.phone = data.phone || null
  if (data.email !== undefined) updateData.email = data.email || null
  if (data.certifications !== undefined) updateData.certifications = data.certifications || null
  if (data.visible !== undefined) updateData.visible = data.visible
  if (data.order !== undefined) updateData.order = data.order
  if (data.teamId !== undefined) updateData.teamId = data.teamId

  const coach = await prisma.coach.update({
    where: { id: params.id },
    data: updateData,
    include: { team: { select: { grupa: true } } },
  })
  return NextResponse.json(coach)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  await prisma.coach.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
