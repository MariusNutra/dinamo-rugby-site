import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ id: string; teamId: string }> }
) {
  const params = await props.params;
  const authz = await requirePermission('competitions.manage')
  if (authz.error) return authz.error

  const team = await prisma.competitionTeam.findUnique({
    where: { id: params.teamId },
  })

  if (!team || team.competitionId !== params.id) {
    return NextResponse.json({ error: 'Echipa nu a fost gasita' }, { status: 404 })
  }

  await prisma.competitionTeam.delete({ where: { id: params.teamId } })

  return NextResponse.json({ success: true })
}
