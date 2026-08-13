import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const authz = await requirePermission('attendance.manage')
  if (authz.error) return authz.error
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

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const authz = await requirePermission('attendance.manage')
  if (authz.error) return authz.error
  await prisma.trainingSession.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ success: true })
}
