import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { childId } = await params

  try {
    const child = await prisma.child.findUnique({ where: { id: childId } })
    if (!child) {
      return NextResponse.json({ error: 'Sportivul nu a fost gasit' }, { status: 404 })
    }

    const body = await req.json()
    const { teamId } = body

    // Validate team exists if provided
    if (teamId !== null && teamId !== undefined) {
      const team = await prisma.team.findUnique({ where: { id: Number(teamId) } })
      if (!team) {
        return NextResponse.json({ error: 'Echipa nu exista' }, { status: 400 })
      }
    }

    const updated = await prisma.child.update({
      where: { id: childId },
      data: { teamId: teamId !== null && teamId !== undefined ? Number(teamId) : null },
      include: {
        team: { select: { id: true, grupa: true } },
        parent: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      child: {
        id: updated.id,
        name: updated.name,
        birthYear: updated.birthYear,
        teamId: updated.teamId,
        teamName: updated.team?.grupa ?? null,
        parentName: updated.parent.name,
      },
    })
  } catch (error) {
    console.error('Error updating child team:', error)
    return NextResponse.json({ error: 'Eroare la actualizarea echipei' }, { status: 500 })
  }
}
