import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const data = await req.json()

  // Validate end time > start time
  if (data.startTime && data.endTime && data.endTime <= data.startTime) {
    return NextResponse.json({ error: 'Ora de sfârșit trebuie să fie după ora de început.' }, { status: 400 })
  }

  // Check for duplicate: same team, same day, same start time (excluding current)
  if (data.grupa && data.day && data.startTime) {
    const existing = await prisma.trainingSession.findFirst({
      where: {
        grupa: data.grupa,
        day: data.day,
        startTime: data.startTime,
        id: { not: parseInt(params.id) },
      },
    })
    if (existing) {
      return NextResponse.json({ error: `Există deja o sesiune ${data.day} la ${data.startTime} pentru ${data.grupa}.` }, { status: 400 })
    }
  }

  const session = await prisma.trainingSession.update({
    where: { id: parseInt(params.id) },
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  await prisma.trainingSession.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ success: true })
}
