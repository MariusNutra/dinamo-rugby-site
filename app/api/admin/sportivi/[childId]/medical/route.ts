import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { childId: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const records = await prisma.medicalRecord.findMany({
    where: { childId: params.childId },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(records)
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

  const { type, description, severity, returnDate, date } = body

  if (!type || !description) {
    return NextResponse.json({ error: 'Tipul si descrierea sunt obligatorii' }, { status: 400 })
  }

  const child = await prisma.child.findUnique({ where: { id: params.childId } })
  if (!child) {
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  const record = await prisma.medicalRecord.create({
    data: {
      childId: params.childId,
      type: type as string,
      description: description as string,
      severity: severity as string | undefined,
      returnDate: returnDate ? new Date(returnDate as string) : null,
      date: date ? new Date(date as string) : new Date(),
    },
  })

  return NextResponse.json(record, { status: 201 })
}
