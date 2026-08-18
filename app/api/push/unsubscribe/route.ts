import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'
import { getAthleteChildId } from '@/lib/athlete-auth'

export async function POST(req: NextRequest) {
  const childId = await getAthleteChildId()
  const parentId = childId ? null : await getParentId()

  if (!childId && !parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { endpoint } = await req.json()

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint lipsă' }, { status: 400 })
  }

  // Stergem doar abonamentul propriu: cine e logat nu poate opri notificarile
  // altcuiva trimitand `endpoint`-ul lui.
  await prisma.pushSubscription.deleteMany({
    where: childId ? { childId, endpoint } : { parentId: parentId as string, endpoint },
  })

  return NextResponse.json({ success: true })
}
