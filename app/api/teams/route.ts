import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const active = req.nextUrl.searchParams.get('active')
  const where = active === '1' ? { active: true } : {}
  const teams = await prisma.team.findMany({ where, orderBy: { sortOrder: 'asc' } })
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
      color: data.color,
      sortOrder: data.sortOrder,
      ageRange: data.ageRange,
      birthYear: data.birthYear,
    },
    create: {
      grupa: data.grupa,
      coachName: data.coachName || '—',
      coachPhoto: data.coachPhoto,
      coachBio: data.coachBio,
      schedule: data.schedule,
      description: data.description,
      color: data.color || 'green',
      sortOrder: data.sortOrder ?? 0,
      ageRange: data.ageRange,
      birthYear: data.birthYear,
    },
  })
  return NextResponse.json(team)
}
