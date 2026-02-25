import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function GET(req: NextRequest, { params }: { params: { childId: string } }) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const child = await prisma.child.findUnique({
    where: { id: params.childId },
    include: {
      parent: { select: { name: true, email: true } },
      team: { select: { grupa: true } },
    },
  })

  if (!child || child.parentId !== parentId) {
    return NextResponse.json({ error: 'Copil negăsit' }, { status: 404 })
  }

  return NextResponse.json({
    childName: child.name,
    birthYear: child.birthYear,
    teamName: child.team?.grupa ?? null,
    parentName: child.parent.name,
    parentEmail: child.parent.email,
    photoConsent: child.photoConsent,
    photoConsentWA: child.photoConsentWA,
    photoConsentDate: child.photoConsentDate,
    hasSigned: Boolean(child.signatureData),
  })
}

export async function POST(req: NextRequest, { params }: { params: { childId: string } }) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const child = await prisma.child.findUnique({ where: { id: params.childId } })
  if (!child || child.parentId !== parentId) {
    return NextResponse.json({ error: 'Copil negăsit' }, { status: 404 })
  }

  const { photoConsent, photoConsentWA, signatureData } = await req.json()

  if (!signatureData || typeof signatureData !== 'string') {
    return NextResponse.json({ error: 'Semnătura este obligatorie' }, { status: 400 })
  }

  // Validate base64 PNG, max ~500KB
  if (signatureData.length > 500 * 1024) {
    return NextResponse.json({ error: 'Semnătura este prea mare' }, { status: 400 })
  }

  if (!signatureData.startsWith('data:image/png;base64,')) {
    return NextResponse.json({ error: 'Format semnătură invalid' }, { status: 400 })
  }

  await prisma.child.update({
    where: { id: params.childId },
    data: {
      photoConsent: Boolean(photoConsent),
      photoConsentWA: Boolean(photoConsentWA),
      photoConsentDate: new Date(),
      signatureData,
    },
  })

  return NextResponse.json({ success: true })
}
