import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { name, logo, website, description, tier, sortOrder, active } = body

  const sponsor = await prisma.sponsor.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name: String(name).slice(0, 200) }),
      ...(logo !== undefined && { logo }),
      ...(website !== undefined && { website: website ? String(website).slice(0, 500) : null }),
      ...(description !== undefined && { description: description ? String(description).slice(0, 2000) : null }),
      ...(tier !== undefined && { tier }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      ...(active !== undefined && { active }),
    },
  })
  return NextResponse.json(sponsor)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  await prisma.sponsor.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
