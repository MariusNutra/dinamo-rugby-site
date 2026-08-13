import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function GET(req: NextRequest, props: { params: Promise<{ grupa: string }> }) {
  const params = await props.params;
  const team = await prisma.team.findUnique({ where: { grupa: params.grupa } })
  return NextResponse.json(team)
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ grupa: string }> }) {
  const params = await props.params;
  const authz = await requirePermission('teams.manage')
  if (authz.error) return authz.error
  const data = await req.json()
  const team = await prisma.team.update({
    where: { grupa: params.grupa },
    data,
  })
  return NextResponse.json(team)
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ grupa: string }> }) {
  const params = await props.params;
  const authz = await requirePermission('teams.manage')
  if (authz.error) return authz.error
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
