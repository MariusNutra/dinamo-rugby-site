import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const board = await prisma.tacticalBoard.findUnique({
    where: { id: params.id },
    include: {
      team: {
        select: { id: true, grupa: true, color: true },
      },
    },
  })

  if (!board) {
    return NextResponse.json({ error: 'Tabla tactica negasita' }, { status: 404 })
  }

  return NextResponse.json(board)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { name, formation, notes, teamId } = body

  // Verify board exists
  const existing = await prisma.tacticalBoard.findUnique({
    where: { id: params.id },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Tabla tactica negasita' }, { status: 404 })
  }

  const board = await prisma.tacticalBoard.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name: String(name).slice(0, 200) }),
      ...(formation !== undefined && {
        formation: typeof formation === 'string' ? formation : JSON.stringify(formation),
      }),
      ...(notes !== undefined && { notes: notes ? String(notes).slice(0, 5000) : null }),
      ...(teamId !== undefined && { teamId: teamId ? Number(teamId) : null }),
    },
    include: {
      team: {
        select: { id: true, grupa: true, color: true },
      },
    },
  })

  return NextResponse.json(board)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const existing = await prisma.tacticalBoard.findUnique({
    where: { id: params.id },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Tabla tactica negasita' }, { status: 404 })
  }

  await prisma.tacticalBoard.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
