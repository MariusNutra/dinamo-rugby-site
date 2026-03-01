import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAppToken } from '@/lib/app-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  const payload = verifyAppToken(request)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { childId } = params
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)

  const attendances = await prisma.attendance.findMany({
    where: { childId },
    orderBy: { date: 'desc' },
    take: limit,
  })

  return NextResponse.json({
    data: attendances.map((a) => ({
      id: a.id,
      date: a.date.toISOString(),
      status: a.present ? 'present' : 'absent',
      type: a.type,
      notes: a.notes,
    })),
  })
}
