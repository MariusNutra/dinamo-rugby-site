import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  const teams = await prisma.team.findMany({ orderBy: { grupa: 'asc' } })
  return NextResponse.json(teams)
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const data = await req.json()
  const team = await prisma.team.upsert({
    where: { grupa: data.grupa },
    update: {
      coachName: data.coachName,
      coachPhoto: data.coachPhoto,
      coachBio: data.coachBio,
      schedule: data.schedule,
      description: data.description,
    },
    create: {
      grupa: data.grupa,
      coachName: data.coachName,
      coachPhoto: data.coachPhoto,
      coachBio: data.coachBio,
      schedule: data.schedule,
      description: data.description,
    },
  })
  return NextResponse.json(team)
}
