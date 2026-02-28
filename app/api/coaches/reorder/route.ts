import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

export async function PUT(req: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const { ids } = await req.json() as { ids: string[] }

  // Update order for each coach based on position in array
  await Promise.all(
    ids.map((id, index) =>
      prisma.coach.update({ where: { id }, data: { order: index } })
    )
  )

  return NextResponse.json({ success: true })
}
