import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey, checkEndpointPermission } from '@/lib/api-auth'
import { verifyAppToken, canAccessChild } from '@/lib/app-auth'
import { trainingOccurrences } from '@/lib/training-occurrences'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  // Accept Bearer JWT from mobile app OR API key
  const appUser = verifyAppToken(request)

  if (!appUser) {
    // Fallback to API key auth
    const auth = await validateApiKey(request)
    if (!auth.valid || !auth.apiKey) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: auth.error || 'Unauthorized' } },
        { status: 401 }
      )
    }

    if (!checkEndpointPermission(auth.apiKey, 'calendar')) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'API key does not have permission for this endpoint.' } },
        { status: 403 }
      )
    }
  }

  try {
    const url = new URL(request.url)
    const limitParam = parseInt(url.searchParams.get('limit') || '50')
    const offsetParam = parseInt(url.searchParams.get('offset') || '0')
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? 50 : limitParam), 100)
    const offset = Math.max(0, isNaN(offsetParam) ? 0 : offsetParam)

    const now = new Date()
    const childId = url.searchParams.get('childId')
    const daysParam = parseInt(url.searchParams.get('days') || '28')
    const days = Math.min(Math.max(1, isNaN(daysParam) ? 28 : daysParam), 90)

    // Cu `childId`, programul e al copilului: evenimentele echipei lui plus
    // cele fara echipa (sunt ale clubului intreg), plus antrenamentele grupei.
    // Fara `childId` — cazul cheilor de API — raspunsul ramane ce era.
    let team: { id: number; grupa: string } | null = null
    if (childId) {
      if (!appUser || !(await canAccessChild(appUser, childId))) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Forbidden' } },
          { status: 403 }
        )
      }
      const child = await prisma.child.findUnique({
        where: { id: childId },
        include: { team: { select: { id: true, grupa: true } } },
      })
      team = child?.team ?? null
    }

    const where = team
      ? { date: { gte: now }, OR: [{ teamId: team.id }, { teamId: null }] }
      : { date: { gte: now } }

    const events = await prisma.calendarEvent.findMany({
      where,
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
    })

    const trainings = team ? await trainingOccurrences(team.grupa, days, now) : []

    const merged = [
      ...events.map((event) => ({
        id: event.id,
        title: event.title,
        type: event.type,
        date: event.date.toISOString(),
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        description: event.description,
        team: event.team,
      })),
      ...trainings,
    ].sort((a, b) => a.date.localeCompare(b.date))

    const data = merged.slice(offset, offset + limit)

    return NextResponse.json({
      data,
      meta: { total: merged.length, timestamp: new Date().toISOString() },
    })
  } catch (err) {
    console.error('API v1 /calendar error:', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    )
  }
}
