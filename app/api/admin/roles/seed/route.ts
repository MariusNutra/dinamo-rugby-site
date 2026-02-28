import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { DEFAULT_ROLES } from '@/lib/permissions'

export async function POST() {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

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
