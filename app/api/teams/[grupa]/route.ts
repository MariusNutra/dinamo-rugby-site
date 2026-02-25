import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { grupa: string } }) {
  const team = await prisma.team.findUnique({ where: { grupa: params.grupa } })
  return NextResponse.json(team)
}

export async function PATCH(req: NextRequest, { params }: { params: { grupa: string } }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const data = await req.json()
  const team = await prisma.team.update({
    where: { grupa: params.grupa },
    data,
  })
  return NextResponse.json(team)
}

export async function DELETE(req: NextRequest, { params }: { params: { grupa: string } }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const team = await prisma.team.findUnique({ where: { grupa: params.grupa } })
  if (!team) {
    return NextResponse.json({ error: 'Echipa nu există' }, { status: 404 })
  }
  // Cascade: delete coaches (handled by Prisma onDelete: Cascade)
  // Delete related training sessions and matches manually
  await prisma.trainingSession.deleteMany({ where: { grupa: params.grupa } })
  await prisma.match.deleteMany({ where: { category: params.grupa } })
  await prisma.team.delete({ where: { grupa: params.grupa } })
  return NextResponse.json({ ok: true })
}
