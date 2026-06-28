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
    include: { team: { select: { id: true, grupa: true, color: true } } },
  })

  if (!coach) {
    return NextResponse.json({ error: 'Antrenor negasit' }, { status: 404 })
  }

  return NextResponse.json({
    id: coach.id,
    name: coach.name,
    email: coach.email,
    phone: coach.phone,
    teamId: coach.teamId,
    teamName: coach.team?.grupa ?? null,
    teamColor: coach.team?.color ?? null,
  })
}
