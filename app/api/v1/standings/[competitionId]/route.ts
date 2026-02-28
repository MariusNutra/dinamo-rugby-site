import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey, checkEndpointPermission } from '@/lib/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  // Validate API key
  const auth = await validateApiKey(request)
  if (!auth.valid || !auth.apiKey) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: auth.error || 'Unauthorized' } },
      { status: 401 }
    )
  }

  // Check endpoint permission
  if (!checkEndpointPermission(auth.apiKey, 'standings')) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'API key does not have permission for this endpoint.' } },
      { status: 403 }
    )
  }

  try {
    const { competitionId } = await params
    const url = new URL(request.url)
    const limitParam = parseInt(url.searchParams.get('limit') || '50')
    const offsetParam = parseInt(url.searchParams.get('offset') || '0')
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? 50 : limitParam), 100)
    const offset = Math.max(0, isNaN(offsetParam) ? 0 : offsetParam)

    // Verify competition exists
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        name: true,
        type: true,
        season: true,
        category: true,
        active: true,
      },
    })

    if (!competition) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Competition not found.' } },
        { status: 404 }
      )
    }

    const [standings, total] = await Promise.all([
      prisma.competitionTeam.findMany({
        where: { competitionId },
        orderBy: [
          { points: 'desc' },
          { won: 'desc' },
          { goalsFor: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.competitionTeam.count({ where: { competitionId } }),
    ])

    const data = standings.map((team, index) => ({
      position: offset + index + 1,
      id: team.id,
      teamName: team.teamName,
      played: team.played,
      won: team.won,
      drawn: team.drawn,
      lost: team.lost,
      goalsFor: team.goalsFor,
      goalsAgainst: team.goalsAgainst,
      goalDifference: team.goalsFor - team.goalsAgainst,
      points: team.points,
    }))

    return NextResponse.json({
      data,
      meta: {
        total,
        timestamp: new Date().toISOString(),
        competition: {
          id: competition.id,
          name: competition.name,
          type: competition.type,
          season: competition.season,
          category: competition.category,
        },
      },
    })
  } catch (err) {
    console.error('API v1 /standings error:', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    )
  }
}
