import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

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
