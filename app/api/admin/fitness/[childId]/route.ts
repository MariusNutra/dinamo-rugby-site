import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { childId: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const where: Record<string, unknown> = { childId: params.childId }
  if (from || to) {
    const dateFilter: Record<string, Date> = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to)
    where.date = dateFilter
  }

  const data = await prisma.fitnessData.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 100,
  })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: { childId: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { date, heartRateAvg, heartRateMax, distance, sprintCount, calories, sleepHours, notes } = body

  if (!date) {
    return NextResponse.json({ error: 'Data este obligatorie' }, { status: 400 })
  }

  const child = await prisma.child.findUnique({ where: { id: params.childId } })
  if (!child) {
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  const entry = await prisma.fitnessData.create({
    data: {
      childId: params.childId,
      date: new Date(date as string),
      heartRateAvg: heartRateAvg != null ? Number(heartRateAvg) : null,
      heartRateMax: heartRateMax != null ? Number(heartRateMax) : null,
      distance: distance != null ? Number(distance) : null,
      sprintCount: sprintCount != null ? Number(sprintCount) : null,
      calories: calories != null ? Number(calories) : null,
      sleepHours: sleepHours != null ? Number(sleepHours) : null,
      notes: (notes as string) || null,
      source: 'manual',
    },
  })

  return NextResponse.json(entry, { status: 201 })
}
