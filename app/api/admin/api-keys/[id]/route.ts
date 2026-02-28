import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const { id } = await params
  const body = await req.json()
  const { name, rateLimitPerMinute, permissions, active } = body

  const existing = await prisma.apiKey.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Cheia API nu a fost gasita' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}

  if (name !== undefined) {
    if (!String(name).trim()) {
      return NextResponse.json({ error: 'Numele nu poate fi gol' }, { status: 400 })
    }
    updateData.name = String(name).trim().slice(0, 200)
  }

  if (rateLimitPerMinute !== undefined) {
    updateData.rateLimitPerMinute = Math.max(1, Math.min(1000, Number(rateLimitPerMinute)))
  }

  if (permissions !== undefined) {
    const validEndpoints = ['teams', 'matches', 'calendar', 'standings', 'athletes']
    const permArray = Array.isArray(permissions)
      ? permissions.filter((p: string) => validEndpoints.includes(p))
      : []
    updateData.permissions = JSON.stringify(permArray)
  }

  if (active !== undefined) {
    updateData.active = Boolean(active)
  }

  const updated = await prisma.apiKey.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({
    ...updated,
    permissions: (() => {
      try {
        const parsed = JSON.parse(updated.permissions)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    })(),
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const { id } = await params

  const existing = await prisma.apiKey.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Cheia API nu a fost gasita' }, { status: 404 })
  }

  await prisma.apiKey.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
