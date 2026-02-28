import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const url = new URL(req.url)
  const teamId = url.searchParams.get('teamId')
  if (!teamId) {
    return NextResponse.json({ error: 'teamId obligatoriu' }, { status: 400 })
  }

  const team = await prisma.team.findUnique({ where: { id: Number(teamId) } })
  if (!team) {
    return NextResponse.json({ error: 'Echipa negasita' }, { status: 404 })
  }

  const children = await prisma.child.findMany({
    where: { teamId: Number(teamId) },
    include: { parent: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({
    team: team.grupa,
    players: children.map(c => ({
      name: c.name,
      birthYear: c.birthYear,
      parent: c.parent.name,
      phone: c.parent.phone || '',
    })),
  })
}
