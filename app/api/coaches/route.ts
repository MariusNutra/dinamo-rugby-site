import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get('teamId')

  const coaches = await prisma.coach.findMany({
    where: teamId ? { teamId: parseInt(teamId) } : {},
    orderBy: { order: 'asc' },
    include: { team: { select: { grupa: true } } },
  })
  return NextResponse.json(coaches)
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const data = await req.json()

  // Get next order value
  const maxOrder = await prisma.coach.findFirst({
    where: { teamId: data.teamId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })

  const coach = await prisma.coach.create({
    data: {
      name: data.name,
      description: data.description || null,
      photo: data.photo || null,
      phone: data.phone || null,
      email: data.email || null,
      certifications: data.certifications || null,
      visible: data.visible !== undefined ? data.visible : true,
      order: (maxOrder?.order ?? -1) + 1,
      teamId: data.teamId,
    },
    include: { team: { select: { grupa: true } } },
  })
  return NextResponse.json(coach)
}
