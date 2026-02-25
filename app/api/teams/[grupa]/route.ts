import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { grupa: string } }) {
  const team = await prisma.team.findUnique({ where: { grupa: params.grupa } })
  return NextResponse.json(team)
}

export async function PATCH(req: NextRequest, { params }: { params: { grupa: string } }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const { active } = await req.json()
  const team = await prisma.team.update({
    where: { grupa: params.grupa },
    data: { active },
  })
  return NextResponse.json(team)
}
