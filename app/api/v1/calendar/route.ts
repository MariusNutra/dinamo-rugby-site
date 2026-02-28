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
  if (!checkEndpointPermission(auth.apiKey, 'calendar')) {
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

    const now = new Date()

    const [events, total] = await Promise.all([
      prisma.calendarEvent.findMany({
        where: {
          date: { gte: now },
        },
        include: {
          team: {
            select: {
              id: true,
              grupa: true,
              color: true,
            },
          },
        },
        orderBy: { date: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.calendarEvent.count({
        where: {
          date: { gte: now },
        },
      }),
    ])

    const data = events.map((event) => ({
      id: event.id,
      title: event.title,
      type: event.type,
      date: event.date.toISOString(),
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      description: event.description,
      team: event.team,
    }))

    return NextResponse.json({
      data,
      meta: { total, timestamp: new Date().toISOString() },
    })
  } catch (err) {
    console.error('API v1 /calendar error:', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    )
  }
}
