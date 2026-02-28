import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const competition = await prisma.competition.findUnique({
    where: { id: params.id },
    include: {
      teams: {
        orderBy: [
          { points: 'desc' },
          { goalsFor: 'desc' },
        ],
      },
      matches: {
        orderBy: { date: 'desc' },
      },
    },
  })

  if (!competition) {
    return NextResponse.json({ error: 'Competiția nu a fost găsită' }, { status: 404 })
  }

  // Sort teams by points desc, then goal difference desc, then goalsFor desc
  const sortedTeams = [...competition.teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const gdA = a.goalsFor - a.goalsAgainst
    const gdB = b.goalsFor - b.goalsAgainst
    if (gdB !== gdA) return gdB - gdA
    return b.goalsFor - a.goalsFor
  })

  return NextResponse.json({
    ...competition,
    teams: sortedTeams,
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const existing = await prisma.competition.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Competiția nu a fost găsită' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = String(body.name).trim()
  if (body.type !== undefined) updateData.type = String(body.type)
  if (body.season !== undefined) updateData.season = body.season ? String(body.season) : null
  if (body.category !== undefined) updateData.category = body.category ? String(body.category) : null
  if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate as string) : null
  if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate as string) : null
  if (body.description !== undefined) updateData.description = body.description ? String(body.description) : null
  if (body.active !== undefined) updateData.active = Boolean(body.active)

  const competition = await prisma.competition.update({
    where: { id: params.id },
    data: updateData,
    include: {
      teams: {
        orderBy: [
          { points: 'desc' },
          { goalsFor: 'desc' },
        ],
      },
      matches: {
        orderBy: { date: 'desc' },
      },
    },
  })

  return NextResponse.json(competition)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const existing = await prisma.competition.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Competiția nu a fost găsită' }, { status: 404 })
  }

  await prisma.competition.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
