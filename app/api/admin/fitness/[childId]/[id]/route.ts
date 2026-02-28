import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { childId: string; id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const entry = await prisma.fitnessData.findFirst({
    where: { id: params.id, childId: params.childId },
  })

  if (!entry) {
    return NextResponse.json({ error: 'Inregistrare negasita' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const updated = await prisma.fitnessData.update({
    where: { id: params.id },
    data: {
      date: body.date ? new Date(body.date as string) : undefined,
      heartRateAvg: body.heartRateAvg !== undefined ? (body.heartRateAvg != null ? Number(body.heartRateAvg) : null) : undefined,
      heartRateMax: body.heartRateMax !== undefined ? (body.heartRateMax != null ? Number(body.heartRateMax) : null) : undefined,
      distance: body.distance !== undefined ? (body.distance != null ? Number(body.distance) : null) : undefined,
      sprintCount: body.sprintCount !== undefined ? (body.sprintCount != null ? Number(body.sprintCount) : null) : undefined,
      calories: body.calories !== undefined ? (body.calories != null ? Number(body.calories) : null) : undefined,
      sleepHours: body.sleepHours !== undefined ? (body.sleepHours != null ? Number(body.sleepHours) : null) : undefined,
      notes: body.notes !== undefined ? ((body.notes as string) || null) : undefined,
      source: body.source !== undefined ? (body.source as string) : undefined,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { childId: string; id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const entry = await prisma.fitnessData.findFirst({
    where: { id: params.id, childId: params.childId },
  })

  if (!entry) {
    return NextResponse.json({ error: 'Inregistrare negasita' }, { status: 404 })
  }

  await prisma.fitnessData.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
