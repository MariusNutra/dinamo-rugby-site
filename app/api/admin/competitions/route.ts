import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function GET() {
  const authz = await requirePermission('teams.view')
  if (authz.error) return authz.error

  const competitions = await prisma.competition.findMany({
    include: {
      teams: {
        orderBy: [
          { points: 'desc' },
          { goalsFor: 'desc' },
        ],
      },
      _count: {
        select: { matches: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const result = competitions.map(c => ({
    ...c,
    teamCount: c.teams.length,
    matchCount: c._count.matches,
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const authz = await requirePermission('competitions.manage')
  if (authz.error) return authz.error

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { name, type, season, category, startDate, endDate, description, teams } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Numele competiției este obligatoriu' }, { status: 400 })
  }

  const competition = await prisma.competition.create({
    data: {
      name: (name as string).trim(),
      type: (type as string) || 'turneu',
      season: season ? String(season) : null,
      category: category ? String(category) : null,
      startDate: startDate ? new Date(startDate as string) : null,
      endDate: endDate ? new Date(endDate as string) : null,
      description: description ? String(description) : null,
      teams: {
        create: Array.isArray(teams)
          ? (teams as { teamName: string }[])
              .filter(t => t.teamName && t.teamName.trim())
              .map(t => ({ teamName: t.teamName.trim() }))
          : [],
      },
    },
    include: {
      teams: true,
      _count: { select: { matches: true } },
    },
  })

  return NextResponse.json(competition, { status: 201 })
}
