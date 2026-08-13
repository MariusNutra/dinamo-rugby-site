import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const authz = await requirePermission('competitions.manage')
  if (authz.error) return authz.error

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { teamName } = body

  if (!teamName || typeof teamName !== 'string' || teamName.trim().length === 0) {
    return NextResponse.json({ error: 'Numele echipei este obligatoriu' }, { status: 400 })
  }

  const competition = await prisma.competition.findUnique({ where: { id: params.id } })
  if (!competition) {
    return NextResponse.json({ error: 'Competitia nu a fost gasita' }, { status: 404 })
  }

  const team = await prisma.competitionTeam.create({
    data: {
      competitionId: params.id,
      teamName: (teamName as string).trim(),
    },
  })

  return NextResponse.json(team, { status: 201 })
}
