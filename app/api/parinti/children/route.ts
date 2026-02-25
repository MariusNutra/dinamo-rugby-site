import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function POST(req: NextRequest) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { name, birthYear, teamId } = await req.json()

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'Numele copilului este obligatoriu' }, { status: 400 })
  }

  if (name.length > 200) {
    return NextResponse.json({ error: 'Numele este prea lung' }, { status: 400 })
  }

  const year = Number(birthYear)
  const currentYear = new Date().getFullYear()
  if (!year || year < currentYear - 20 || year > currentYear) {
    return NextResponse.json({ error: 'Anul nașterii este invalid' }, { status: 400 })
  }

  // Validate teamId if provided
  if (teamId !== null && teamId !== undefined) {
    const team = await prisma.team.findUnique({ where: { id: Number(teamId) } })
    if (!team) {
      return NextResponse.json({ error: 'Echipa selectată nu există' }, { status: 400 })
    }
  }

  const child = await prisma.child.create({
    data: {
      name: name.trim(),
      birthYear: year,
      parentId,
      teamId: teamId ? Number(teamId) : null,
    },
    include: { team: { select: { id: true, grupa: true } } },
  })

  return NextResponse.json({
    success: true,
    child: {
      id: child.id,
      name: child.name,
      birthYear: child.birthYear,
      teamId: child.teamId,
      teamName: child.team?.grupa ?? null,
    },
  })
}
