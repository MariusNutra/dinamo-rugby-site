import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function GET(req: NextRequest, { params }: { params: { childId: string } }) {
  const authz = await requirePermission('athletes.view')
  if (authz.error) return authz.error

  const records = await prisma.medicalRecord.findMany({
    where: { childId: params.childId },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(records)
}

export async function POST(req: NextRequest, { params }: { params: { childId: string } }) {
  const authz = await requirePermission('athletes.manage')
  if (authz.error) return authz.error

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
