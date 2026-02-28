import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey, checkEndpointPermission } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  // Validate API key
  const auth = await validateApiKey(request)
  if (!auth.valid || !auth.apiKey) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: auth.error || 'Unauthorized' } },
      { status: 401 }
    )
  }

  // Check endpoint permission
  if (!checkEndpointPermission(auth.apiKey, 'matches')) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'API key does not have permission for this endpoint.' } },
      { status: 403 }
    )
  }

  try {
    const url = new URL(request.url)
    const limitParam = parseInt(url.searchParams.get('limit') || '50')
    const offsetParam = parseInt(url.searchParams.get('offset') || '0')
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? 50 : limitParam), 100)
    const offset = Math.max(0, isNaN(offsetParam) ? 0 : offsetParam)

    const competitionId = url.searchParams.get('competitionId') || undefined

    const where: Record<string, unknown> = {}
    if (competitionId) {
      where.competitionId = competitionId
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          competition: {
            select: {
              id: true,
              name: true,
              type: true,
              season: true,
              category: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.match.count({ where }),
    ])

    const data = matches.map((match) => ({
      id: match.id,
      category: match.category,
      matchType: match.matchType,
      round: match.round,
      date: match.date.toISOString(),
      location: match.location,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      isDinamo: match.isDinamo,
      notes: match.notes,
      competition: match.competition,
    }))

    return NextResponse.json({
      data,
      meta: { total, timestamp: new Date().toISOString() },
    })
  } catch (err) {
    console.error('API v1 /matches error:', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    )
  }
}
