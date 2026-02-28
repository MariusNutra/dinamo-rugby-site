import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const report = await prisma.scoutingReport.findUnique({
    where: { id: params.id },
    include: {
      prospects: {
        orderBy: { rating: 'desc' },
      },
    },
  })

  if (!report) {
    return NextResponse.json({ error: 'Raport negasit' }, { status: 404 })
  }

  return NextResponse.json(report)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { eventName, eventDate, location, notes } = body

  const existing = await prisma.scoutingReport.findUnique({
    where: { id: params.id },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Raport negasit' }, { status: 404 })
  }

  const report = await prisma.scoutingReport.update({
    where: { id: params.id },
    data: {
      ...(eventName !== undefined && { eventName: String(eventName).slice(0, 300) }),
      ...(eventDate !== undefined && { eventDate: new Date(eventDate) }),
      ...(location !== undefined && { location: location ? String(location).slice(0, 300) : null }),
      ...(notes !== undefined && { notes: notes ? String(notes).slice(0, 5000) : null }),
    },
    include: {
      prospects: {
        orderBy: { rating: 'desc' },
      },
    },
  })

  return NextResponse.json(report)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const existing = await prisma.scoutingReport.findUnique({
    where: { id: params.id },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Raport negasit' }, { status: 404 })
  }

  // Delete associated prospects first, then the report
  await prisma.prospect.deleteMany({
    where: { scoutingReportId: params.id },
  })

  await prisma.scoutingReport.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
