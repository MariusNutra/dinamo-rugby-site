import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authz'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const authz = await requirePermission('settings.manage')
  if (authz.error) return authz.error
  const sponsors = await prisma.sponsor.findMany({ orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }] })
  return NextResponse.json(sponsors)
}

export async function POST(req: NextRequest) {
  const authz = await requirePermission('settings.manage')
  if (authz.error) return authz.error
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { name, logo, website, description, tier, sortOrder } = body

  if (!name) {
    return NextResponse.json({ error: 'Numele este obligatoriu' }, { status: 400 })
  }

  const sponsor = await prisma.sponsor.create({
    data: {
      name: String(name).slice(0, 200),
      logo: logo ? String(logo) : null,
      website: website ? String(website).slice(0, 500) : null,
      description: description ? String(description).slice(0, 2000) : null,
      tier: tier || 'bronze',
      sortOrder: sortOrder ? Number(sortOrder) : 0,
    },
  })
  return NextResponse.json(sponsor, { status: 201 })
}
