import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/authz'

export async function GET(req: NextRequest) {
  const authz = await requireAdmin()
  if (authz.error) return authz.error

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
  const entity = searchParams.get('entity')

  const logs = await prisma.auditLog.findMany({
    where: entity ? { entity } : {},
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json(logs)
}
