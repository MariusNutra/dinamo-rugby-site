import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function POST(req: NextRequest) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { name, phone, whatsappConsent } = await req.json()

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'Numele este obligatoriu (min. 2 caractere)' }, { status: 400 })
  }

  if (name.length > 200) {
    return NextResponse.json({ error: 'Numele este prea lung' }, { status: 400 })
  }

  if (phone && typeof phone === 'string' && phone.length > 20) {
    return NextResponse.json({ error: 'Numărul de telefon este prea lung' }, { status: 400 })
  }

  const parent = await prisma.parent.update({
    where: { id: parentId },
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      whatsappConsent: Boolean(whatsappConsent),
    },
  })

  return NextResponse.json({ success: true, parent: { id: parent.id, name: parent.name } })
}
