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
  if (!checkEndpointPermission(auth.apiKey, 'athletes')) {
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

    const where = {
      publicProfile: true,
      photoConsent: true,
    }

    const [athletes, total] = await Promise.all([
      prisma.child.findMany({
        where,
        select: {
          id: true,
          name: true,
          birthYear: true,
          publicBio: true,
          team: {
            select: {
              id: true,
              grupa: true,
              color: true,
            },
          },
          childPhotos: {
            select: {
              id: true,
              url: true,
              caption: true,
            },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.child.count({ where }),
    ])

    const data = athletes.map((athlete) => ({
      id: athlete.id,
      name: athlete.name,
      birthYear: athlete.birthYear,
      bio: athlete.publicBio,
      team: athlete.team,
      photo: athlete.childPhotos[0] || null,
    }))

    return NextResponse.json({
      data,
      meta: { total, timestamp: new Date().toISOString() },
    })
  } catch (err) {
    console.error('API v1 /athletes error:', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    )
  }
}
