import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const grupa = searchParams.get('grupa')

  const matches = await prisma.match.findMany({
    where: grupa ? { grupa } : {},
    orderBy: { date: 'desc' },
    take: 20,
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
      grupa: data.grupa,
      date: new Date(data.date),
      opponent: data.opponent,
      location: data.location || null,
      scoreHome: data.scoreHome ? parseInt(data.scoreHome) : null,
      scoreAway: data.scoreAway ? parseInt(data.scoreAway) : null,
      description: data.description,
    },
  })
  return NextResponse.json(match)
}
