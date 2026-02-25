import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get('teamId')
  const childId = searchParams.get('childId')
  const period = searchParams.get('period')

  const where: Record<string, unknown> = {}
  if (childId) where.childId = childId
  if (period) where.period = period
  if (teamId) {
    where.child = { teamId: Number(teamId) }
  }

  const evaluations = await prisma.evaluation.findMany({
    where,
    include: {
      child: { select: { id: true, name: true, teamId: true, team: { select: { grupa: true } } } },
    },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(evaluations)
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { childId, period, physical, technical, tactical, mental, social, comments, date } = body

  if (!childId || !period || physical == null || technical == null || tactical == null || mental == null || social == null) {
    return NextResponse.json({ error: 'Toate scorurile sunt obligatorii' }, { status: 400 })
  }

  const child = await prisma.child.findUnique({ where: { id: childId as string } })
  if (!child) {
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  const evaluation = await prisma.evaluation.create({
    data: {
      childId: childId as string,
      period: period as string,
      physical: Number(physical),
      technical: Number(technical),
      tactical: Number(tactical),
      mental: Number(mental),
      social: Number(social),
      comments: comments as string | undefined,
      date: date ? new Date(date as string) : new Date(),
    },
  })

  return NextResponse.json(evaluation, { status: 201 })
}
