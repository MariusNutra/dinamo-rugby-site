import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function POST(req: NextRequest) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { endpoint } = await req.json()

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint lipsă' }, { status: 400 })
  }

  await prisma.pushSubscription.deleteMany({
    where: { parentId, endpoint },
  })

  return NextResponse.json({ success: true })
}
