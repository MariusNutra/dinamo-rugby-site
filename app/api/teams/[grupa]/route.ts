import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { grupa: string } }) {
  const team = await prisma.team.findUnique({ where: { grupa: params.grupa } })
  return NextResponse.json(team)
}
