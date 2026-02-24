import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const grupa = searchParams.get('grupa')

  const sessions = await prisma.trainingSession.findMany({
    where: grupa ? { grupa } : {},
    orderBy: [{ grupa: 'asc' }, { day: 'asc' }, { startTime: 'asc' }],
  })
  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const data = await req.json()
  const session = await prisma.trainingSession.create({
    data: {
      grupa: data.grupa,
      day: data.day,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      coachName: data.coachName || null,
    },
  })
  return NextResponse.json(session)
}
