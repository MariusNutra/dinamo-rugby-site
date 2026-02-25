import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function GET(req: NextRequest, { params }: { params: { childId: string } }) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const child = await prisma.child.findUnique({ where: { id: params.childId } })
  if (!child || child.parentId !== parentId) {
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  // GDPR gate: if no photo consent, return flag instead of photos
  if (!child.photoConsent) {
    return NextResponse.json({ consentRequired: true, photos: [] })
  }

  const photos = await prisma.childPhoto.findMany({
    where: { childId: params.childId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ consentRequired: false, photos })
}
