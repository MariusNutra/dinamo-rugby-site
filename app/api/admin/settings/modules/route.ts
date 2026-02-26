import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'
import { MODULE_DEFINITIONS } from '@/lib/modules'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  })

  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

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
