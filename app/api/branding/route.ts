import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
    select: {
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      fontFamily: true,
      clubName: true,
      logo: true,
      favicon: true,
    },
  })

  return NextResponse.json(settings, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  })
}
