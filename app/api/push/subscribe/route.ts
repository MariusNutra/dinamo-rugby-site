import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'
import { getAthleteChildId } from '@/lib/athlete-auth'

/**
 * Un dispozitiv se aboneaza la notificari fie ca al parintelui, fie ca al
 * sportivului. Abonamentul se leaga de cine e logat ACUM, nu de ce trimite
 * cererea — pe telefonul din familie pot fi amandoua conturile, iar
 * `endpoint`-ul e acelasi.
 */
export async function POST(req: NextRequest) {
  const childId = await getAthleteChildId()
  const parentId = childId ? null : await getParentId()

  if (!childId && !parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  if (childId) {
    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { accessEnabled: true },
    })
    if (!child?.accessEnabled) {
      return NextResponse.json({ error: 'Acces inchis' }, { status: 403 })
    }
  }

  const { endpoint, keys } = await req.json()

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Date de subscripție invalide' }, { status: 400 })
  }

  // Exact unul dintre cele doua campuri ramane completat: daca acelasi
  // dispozitiv trece de la parinte la sportiv, celalalt se sterge, ca sa nu
  // ajunga o notificare de parinte pe un ecran de copil.
  const proprietar = childId ? { childId, parentId: null } : { parentId, childId: null }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, ...proprietar },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, ...proprietar },
  })

  return NextResponse.json({ success: true })
}
