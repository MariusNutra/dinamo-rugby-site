import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCoachId } from '@/lib/coach-auth'

export async function GET() {
  const coachId = await getCoachId()
  if (!coachId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    include: { team: true },
  })

  if (!coach) {
    return NextResponse.json({ error: 'Antrenor negasit' }, { status: 404 })
  }

  if (!coach.team) {
    return NextResponse.json({ team: null })
  }

  const playerCount = await prisma.child.count({ where: { teamId: coach.team.id } })

  return NextResponse.json({
    team: {
      id: coach.team.id,
      grupa: coach.team.grupa,
      color: coach.team.color,
      ageRange: coach.team.ageRange,
      schedule: coach.team.schedule,
      playerCount,
    },
  })
}
