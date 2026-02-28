import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { childId: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const profiles = await prisma.physicalProfile.findMany({
    where: { childId: params.childId },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(profiles)
}

export async function POST(req: NextRequest, { params }: { params: { childId: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { height, weight, position, notes, date } = body

  const child = await prisma.child.findUnique({ where: { id: params.childId } })
  if (!child) {
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  const profile = await prisma.physicalProfile.create({
    data: {
      childId: params.childId,
      height: height ? Number(height) : null,
      weight: weight ? Number(weight) : null,
      position: position as string | undefined,
      notes: notes as string | undefined,
      date: date ? new Date(date as string) : new Date(),
    },
  })

  return NextResponse.json(profile, { status: 201 })
}
