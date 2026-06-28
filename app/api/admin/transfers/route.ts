import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function GET() {
  const authz = await requirePermission('athletes.view')
  if (authz.error) return authz.error

  try {
    const transfers = await prisma.transferLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        child: { select: { id: true, name: true, birthYear: true } },
        fromTeam: { select: { id: true, grupa: true } },
        toTeam: { select: { id: true, grupa: true } },
      },
    })

    return NextResponse.json(transfers)
  } catch (error) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json({ error: 'Eroare la incarcarea transferurilor' }, { status: 500 })
  }
}
