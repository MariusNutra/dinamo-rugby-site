import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function GET(req: NextRequest) {
  const authz = await requirePermission('requests.manage')
  if (authz.error) return authz.error

  const status = req.nextUrl.searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    where.status = status
  }

  const requests = await prisma.accessRequest.findMany({
    where,
    include: {
      team: { select: { id: true, grupa: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    requests.map(r => ({
      id: r.id,
      parentName: r.parentName,
      email: r.email,
      phone: r.phone,
      childName: r.childName,
      childBirthYear: r.childBirthYear,
      teamId: r.teamId,
      teamName: r.team?.grupa ?? null,
      message: r.message,
      status: r.status,
      reviewedAt: r.reviewedAt,
      reviewedBy: r.reviewedBy,
      createdAt: r.createdAt,
    }))
  )
}
