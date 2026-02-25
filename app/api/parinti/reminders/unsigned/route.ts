import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const children = await prisma.child.findMany({
    where: { photoConsentDate: null },
    include: {
      parent: { select: { name: true, email: true, phone: true } },
      team: { select: { grupa: true } },
    },
    orderBy: [{ team: { grupa: 'asc' } }, { name: 'asc' }],
  })

  return NextResponse.json({
    unsigned: children.map(c => ({
      childName: c.name,
      teamName: c.team?.grupa ?? null,
      parentName: c.parent.name,
      parentEmail: c.parent.email,
      parentPhone: c.parent.phone,
    })),
  })
}
