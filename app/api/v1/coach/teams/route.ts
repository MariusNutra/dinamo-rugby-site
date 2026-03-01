import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCoach } from '@/lib/app-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  const auth = await requireCoach(request)
  if ('error' in auth) return auth.error

  const { team } = auth

  const playerCount = await prisma.child.count({ where: { teamId: team.id } })

  return NextResponse.json({
    data: [
      {
        id: team.id,
        grupa: team.grupa,
        playerCount,
      },
    ],
  })
}
