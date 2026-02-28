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

  const prospect = await prisma.prospect.findUnique({
    where: { id: params.id },
    include: {
      scoutingReport: true,
    },
  })

  if (!prospect) {
    return NextResponse.json({ error: 'Prospect negasit' }, { status: 404 })
  }

  return NextResponse.json(prospect)
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
  const { name, birthYear, position, currentClub, notes, rating, status, phone, email, scoutingReportId } = body

  const existing = await prisma.prospect.findUnique({
    where: { id: params.id },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Prospect negasit' }, { status: 404 })
  }

  const validStatuses = ['identified', 'contacted', 'trial', 'enrolled', 'rejected']

  const prospect = await prisma.prospect.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name: String(name).slice(0, 200) }),
      ...(birthYear !== undefined && { birthYear: birthYear ? Number(birthYear) : null }),
      ...(position !== undefined && { position: position ? String(position).slice(0, 100) : null }),
      ...(currentClub !== undefined && { currentClub: currentClub ? String(currentClub).slice(0, 200) : null }),
      ...(notes !== undefined && { notes: notes ? String(notes).slice(0, 5000) : null }),
      ...(rating !== undefined && { rating: Math.min(5, Math.max(0, Number(rating))) }),
      ...(status !== undefined && validStatuses.includes(status) && { status }),
      ...(phone !== undefined && { phone: phone ? String(phone).slice(0, 50) : null }),
      ...(email !== undefined && { email: email ? String(email).slice(0, 200) : null }),
      ...(scoutingReportId !== undefined && { scoutingReportId: scoutingReportId || null }),
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

  return NextResponse.json(prospect)
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

  const existing = await prisma.prospect.findUnique({
    where: { id: params.id },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Prospect negasit' }, { status: 404 })
  }

  await prisma.prospect.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
