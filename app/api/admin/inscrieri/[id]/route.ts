import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { status, notes } = body

  const validStatuses = ['noua', 'contactata', 'acceptata', 'respinsa']
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Status invalid' }, { status: 400 })
  }

  const registration = await prisma.registration.update({
    where: { id: params.id },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes: notes ? String(notes).slice(0, 1000) : null }),
    },
    include: { team: true },
  })

  return NextResponse.json(registration)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  await prisma.registration.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
