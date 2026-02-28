import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, getAuthUser } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const teamId = req.nextUrl.searchParams.get('teamId')

  const where: Record<string, unknown> = {}
  if (teamId) {
    where.teamId = Number(teamId)
  }

  const boards = await prisma.tacticalBoard.findMany({
    where,
    include: {
      team: {
        select: { id: true, grupa: true, color: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(boards)
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { name, formation, notes, teamId } = body

  if (!name) {
    return NextResponse.json({ error: 'Numele este obligatoriu' }, { status: 400 })
  }

  const user = await getAuthUser()

  const board = await prisma.tacticalBoard.create({
    data: {
      name: String(name).slice(0, 200),
      formation: formation ? (typeof formation === 'string' ? formation : JSON.stringify(formation)) : '{}',
      notes: notes ? String(notes).slice(0, 5000) : null,
      teamId: teamId ? Number(teamId) : null,
      createdBy: user?.username || null,
    },
    include: {
      team: {
        select: { id: true, grupa: true, color: true },
      },
    },
  })

  return NextResponse.json(board, { status: 201 })
}
