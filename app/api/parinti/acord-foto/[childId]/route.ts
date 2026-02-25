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
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
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
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { photoConsent, photoConsentWA, signatureData } = body

  if (!signatureData || typeof signatureData !== 'string') {
    return NextResponse.json({ error: 'Semnatura este obligatorie' }, { status: 400 })
  }

  // Validate base64 PNG, max ~500KB
  if (signatureData.length > 500 * 1024) {
    return NextResponse.json({ error: 'Semnatura este prea mare' }, { status: 400 })
  }

  if (!signatureData.startsWith('data:image/png;base64,')) {
    return NextResponse.json({ error: 'Format semnatura invalid' }, { status: 400 })
  }

  await prisma.child.update({
    where: { id: params.childId },
    data: {
      photoConsent: Boolean(photoConsent),
      photoConsentWA: Boolean(photoConsentWA),
      photoConsentDate: new Date(),
      signatureData: signatureData as string,
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { childId: string } }) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const child = await prisma.child.findUnique({ where: { id: params.childId } })
  if (!child || child.parentId !== parentId) {
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  await prisma.child.update({
    where: { id: params.childId },
    data: {
      photoConsent: false,
      photoConsentWA: false,
      photoConsentDate: null,
      signatureData: null,
    },
  })

  return NextResponse.json({ success: true, message: 'Acordul foto a fost retras.' })
}
