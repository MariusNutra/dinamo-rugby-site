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
  if (!checkEndpointPermission(auth.apiKey, 'teams')) {
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

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where: { active: true },
        include: {
          coaches: {
            where: { visible: true },
            select: {
              id: true,
              name: true,
              description: true,
              photo: true,
              phone: true,
              email: true,
              certifications: true,
              order: true,
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.team.count({ where: { active: true } }),
    ])

    const data = teams.map((team) => ({
      id: team.id,
      grupa: team.grupa,
      description: team.description,
      schedule: team.schedule,
      color: team.color,
      ageRange: team.ageRange,
      birthYear: team.birthYear,
      sortOrder: team.sortOrder,
      coaches: team.coaches,
    }))

    return NextResponse.json({
      data,
      meta: { total, timestamp: new Date().toISOString() },
    })
  } catch (err) {
    console.error('API v1 /teams error:', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    )
  }
}
