import { NextResponse } from 'next/server'
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
    return NextResponse.json({ error: 'Părinte negăsit' }, { status: 404 })
  }

  return NextResponse.json({
    id: parent.id,
    name: parent.name,
    email: parent.email,
    phone: parent.phone,
    whatsappConsent: parent.whatsappConsent,
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
