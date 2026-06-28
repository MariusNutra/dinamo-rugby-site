import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function PUT(req: NextRequest) {
  const authz = await requirePermission('teams.manage')
  if (authz.error) return authz.error
  const { ids } = await req.json() as { ids: string[] }

  // Update order for each coach based on position in array
  await Promise.all(
    ids.map((id, index) =>
      prisma.coach.update({ where: { id }, data: { order: index } })
    )
  )

  return NextResponse.json({ success: true })
}
