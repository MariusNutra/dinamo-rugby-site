import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const child = await prisma.child.findUnique({ where: { id: params.id } })
  if (!child || child.parentId !== parentId) {
    return NextResponse.json({ error: 'Copil negăsit' }, { status: 404 })
  }

  const { name, birthYear, teamId } = await req.json()

  const data: Record<string, unknown> = {}

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Numele este obligatoriu' }, { status: 400 })
    }
    if (name.length > 200) {
      return NextResponse.json({ error: 'Numele este prea lung' }, { status: 400 })
    }
    data.name = name.trim()
  }

  if (birthYear !== undefined) {
    const year = Number(birthYear)
    const currentYear = new Date().getFullYear()
    if (!year || year < currentYear - 20 || year > currentYear) {
      return NextResponse.json({ error: 'Anul nașterii este invalid' }, { status: 400 })
    }
    data.birthYear = year
  }

  if (teamId !== undefined) {
    if (teamId !== null) {
      const team = await prisma.team.findUnique({ where: { id: Number(teamId) } })
      if (!team) {
        return NextResponse.json({ error: 'Echipa selectată nu există' }, { status: 400 })
      }
      data.teamId = Number(teamId)
    } else {
      data.teamId = null
    }
  }

  const updated = await prisma.child.update({
    where: { id: params.id },
    data,
    include: { team: { select: { id: true, grupa: true } } },
  })

  return NextResponse.json({
    success: true,
    child: {
      id: updated.id,
      name: updated.name,
      birthYear: updated.birthYear,
      teamId: updated.teamId,
      teamName: updated.team?.grupa ?? null,
    },
  })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const child = await prisma.child.findUnique({ where: { id: params.id } })
  if (!child || child.parentId !== parentId) {
    return NextResponse.json({ error: 'Copil negăsit' }, { status: 404 })
  }

  await prisma.child.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
