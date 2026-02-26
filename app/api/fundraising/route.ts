import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    where: { active: true },
    include: {
      donations: {
        where: { status: 'completed' },
        select: {
          id: true,
          donorName: true,
          amount: true,
          anonymous: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(campaigns)
}
