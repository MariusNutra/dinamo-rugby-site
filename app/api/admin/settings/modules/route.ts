import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authz'
import { validateCsrf, setCsrfCookie } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'
import { MODULE_DEFINITIONS } from '@/lib/modules'

export async function GET() {
  const authz = await requirePermission('settings.manage')
  if (authz.error) return authz.error

  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  })

  const response = NextResponse.json(settings)
  return setCsrfCookie(response)
}

export async function PUT(req: NextRequest) {
  const authz = await requirePermission('settings.manage')
  if (authz.error) return authz.error

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()

  const validKeys = MODULE_DEFINITIONS.map(m => m.key)
  const updateData: Record<string, unknown> = {}

  for (const key of validKeys) {
    if (key in body && typeof body[key] === 'boolean') {
      updateData[key] = body[key]
    }
  }

  if (body.extraConfig && typeof body.extraConfig === 'string') {
    try {
      JSON.parse(body.extraConfig)
      updateData.extraConfig = body.extraConfig
    } catch {
      // ignore invalid JSON
    }
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: updateData,
    create: { id: 1, ...updateData },
  })

  return NextResponse.json(settings)
}
