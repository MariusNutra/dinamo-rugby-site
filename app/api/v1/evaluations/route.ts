import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAppToken, getAccessibleChildIds } from '@/lib/app-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  const appUser = verifyAppToken(request)
  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const childId = url.searchParams.get('childId')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)

  // Restrict to children the caller may access (own children / coach's team / all for admin)
  const accessibleIds = await getAccessibleChildIds(appUser)
  const where: Record<string, unknown> = {}
  if (childId) {
    if (accessibleIds !== null && !accessibleIds.includes(childId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    where.childId = childId
  } else if (accessibleIds !== null) {
    where.childId = { in: accessibleIds }
  }

  const evaluations = await prisma.evaluation.findMany({
    where,
    orderBy: { date: 'desc' },
    take: limit,
  })

  return NextResponse.json({
    data: evaluations.map((e) => ({
      id: e.id,
      childId: e.childId,
      date: e.date.toISOString(),
      scores: [
        { category: 'Fizic', score: e.physical },
        { category: 'Tehnic', score: e.technical },
        { category: 'Tactic', score: e.tactical },
        { category: 'Mental', score: e.mental },
        { category: 'Social', score: e.social },
      ],
      notes: e.comments,
      evaluatorName: e.createdBy,
    })),
  })
}
