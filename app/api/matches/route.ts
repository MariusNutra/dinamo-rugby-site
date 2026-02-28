import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { isDinamoTeam } from '@/lib/teams'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  const matches = await prisma.match.findMany({
    where: category ? { category } : {},
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(matches)
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const data = await req.json()
  const match = await prisma.match.create({
    data: {
      category: data.category,
      matchType: data.matchType || 'turneu',
      round: data.round || null,
      date: new Date(data.date),
      location: data.location || null,
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      homeScore: data.homeScore != null && data.homeScore !== '' ? parseInt(data.homeScore) : null,
      awayScore: data.awayScore != null && data.awayScore !== '' ? parseInt(data.awayScore) : null,
      isDinamo: data.isDinamo !== undefined ? data.isDinamo : (isDinamoTeam(data.homeTeam) || isDinamoTeam(data.awayTeam)),
      notes: data.notes || null,
      competitionId: data.competitionId || null,
    },
  })
  return NextResponse.json(match)
}
