import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const status = req.nextUrl.searchParams.get('status')
  const reportId = req.nextUrl.searchParams.get('reportId')

  const where: Record<string, unknown> = {}
  if (status) {
    where.status = status
  }
  if (reportId) {
    where.scoutingReportId = reportId
  }

  const prospects = await prisma.prospect.findMany({
    where,
    include: {
      scoutingReport: {
        select: {
          id: true,
          eventName: true,
          eventDate: true,
        },
      },
    },
    orderBy: { rating: 'desc' },
  })

  return NextResponse.json(prospects)
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { name, birthYear, position, currentClub, notes, rating, status, phone, email, scoutingReportId } = body

  if (!name) {
    return NextResponse.json(
      { error: 'Numele este obligatoriu' },
      { status: 400 }
    )
  }

  // Validate scoutingReportId if provided
  if (scoutingReportId) {
    const report = await prisma.scoutingReport.findUnique({
      where: { id: scoutingReportId },
    })
    if (!report) {
      return NextResponse.json(
        { error: 'Raportul de scouting nu a fost gasit' },
        { status: 400 }
      )
    }
  }

  const validStatuses = ['identified', 'contacted', 'trial', 'enrolled', 'rejected']
  const prospectStatus = status && validStatuses.includes(status) ? status : 'identified'

  const prospect = await prisma.prospect.create({
    data: {
      name: String(name).slice(0, 200),
      birthYear: birthYear ? Number(birthYear) : null,
      position: position ? String(position).slice(0, 100) : null,
      currentClub: currentClub ? String(currentClub).slice(0, 200) : null,
      notes: notes ? String(notes).slice(0, 5000) : null,
      rating: rating ? Math.min(5, Math.max(0, Number(rating))) : 0,
      status: prospectStatus,
      phone: phone ? String(phone).slice(0, 50) : null,
      email: email ? String(email).slice(0, 200) : null,
      scoutingReportId: scoutingReportId || null,
    },
    include: {
      scoutingReport: {
        select: {
          id: true,
          eventName: true,
          eventDate: true,
        },
      },
    },
  })

  return NextResponse.json(prospect, { status: 201 })
}
