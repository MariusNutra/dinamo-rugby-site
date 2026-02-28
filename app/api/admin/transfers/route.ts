import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

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
