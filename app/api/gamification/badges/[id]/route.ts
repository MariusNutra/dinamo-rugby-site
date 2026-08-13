import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authz'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const authz = await requirePermission('athletes.manage')
  if (authz.error) return authz.error
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { name, icon, description, criteria, category, active } = body

  // Validate criteria JSON if provided
  let criteriaStr: string | undefined
  if (criteria !== undefined) {
    try {
      if (typeof criteria === 'string') {
        JSON.parse(criteria)
        criteriaStr = criteria
      } else {
        criteriaStr = JSON.stringify(criteria)
      }
    } catch {
      return NextResponse.json({ error: 'Criteriu invalid (JSON)' }, { status: 400 })
    }
  }

  const badge = await prisma.badge.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name: String(name).slice(0, 200) }),
      ...(icon !== undefined && { icon: String(icon).slice(0, 10) }),
      ...(description !== undefined && { description: description ? String(description).slice(0, 1000) : null }),
      ...(criteriaStr !== undefined && { criteria: criteriaStr }),
      ...(category !== undefined && { category: String(category).slice(0, 50) }),
      ...(active !== undefined && { active: Boolean(active) }),
    },
  })

  return NextResponse.json(badge)
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const authz = await requirePermission('athletes.manage')
  if (authz.error) return authz.error
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  await prisma.badge.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
