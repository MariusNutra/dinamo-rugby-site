import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; teamId: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const team = await prisma.competitionTeam.findUnique({
    where: { id: params.teamId },
  })

  if (!team || team.competitionId !== params.id) {
    return NextResponse.json({ error: 'Echipa nu a fost gasita' }, { status: 404 })
  }

  await prisma.competitionTeam.delete({ where: { id: params.teamId } })

  return NextResponse.json({ success: true })
}
