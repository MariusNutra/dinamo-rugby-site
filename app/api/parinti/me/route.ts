import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function GET() {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    include: {
      children: {
        include: { team: { select: { id: true, grupa: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!parent) {
    return NextResponse.json({ error: 'Parinte negasit' }, { status: 404 })
  }

  return NextResponse.json({
    id: parent.id,
    name: parent.name,
    email: parent.email,
    phone: parent.phone,
    children: parent.children.map(c => ({
      id: c.id,
      name: c.name,
      birthYear: c.birthYear,
      teamId: c.teamId,
      teamName: c.team?.grupa ?? null,
      photoConsent: c.photoConsent,
      photoConsentWA: c.photoConsentWA,
      photoConsentDate: c.photoConsentDate,
      signatureData: c.signatureData ? true : false,
      medicalCert: c.medicalCert,
    })),
  })
}

export async function PATCH(req: NextRequest) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { phone } = body

  if (phone !== undefined && phone !== null) {
    if (typeof phone !== 'string') {
      return NextResponse.json({ error: 'Numarul de telefon este invalid.' }, { status: 400 })
    }
    if (phone.length > 20) {
      return NextResponse.json({ error: 'Numarul de telefon este prea lung.' }, { status: 400 })
    }
  }

  const parent = await prisma.parent.update({
    where: { id: parentId },
    data: {
      phone: phone ? (phone as string).trim() : null,
    },
  })

  return NextResponse.json({
    success: true,
    phone: parent.phone,
  })
}
