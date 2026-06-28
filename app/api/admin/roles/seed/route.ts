import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/authz'
import { DEFAULT_ROLES } from '@/lib/permissions'

export async function POST() {
  const authz = await requireAdmin()
  if (authz.error) return authz.error

  const created: string[] = []
  const skipped: string[] = []

  for (const [name, config] of Object.entries(DEFAULT_ROLES)) {
    const existing = await prisma.role.findUnique({ where: { name } })
    if (existing) {
      skipped.push(name)
      continue
    }

    await prisma.role.create({
      data: {
        name,
        label: config.label,
        permissions: JSON.stringify(config.permissions),
        isSystem: true,
      },
    })
    created.push(name)
  }

  return NextResponse.json({
    message: `Roluri create: ${created.length}, deja existente: ${skipped.length}`,
    created,
    skipped,
  })
}
