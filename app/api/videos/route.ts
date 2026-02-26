import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const grupa = url.searchParams.get('grupa')

  const where: Record<string, unknown> = {}
  if (grupa) where.grupa = grupa

  const videos = await prisma.video.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(videos)
}
