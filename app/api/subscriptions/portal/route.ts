import { NextRequest, NextResponse } from 'next/server'
import { getStripe, platileSuntConfigurate, raspunsPlatiIndisponibile } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function POST(req: NextRequest) {
  // Fara cheie de plata configurata, `getStripe()` arunca sincron si Next
  // raspunde 500 cu corpul gol. Iesim devreme, cu un mesaj citibil.
  if (!platileSuntConfigurate()) return raspunsPlatiIndisponibile()

  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const parent = await prisma.parent.findUnique({ where: { id: parentId } })
  if (!parent) {
    return NextResponse.json({ error: 'Părinte negăsit' }, { status: 404 })
  }

  const stripe = getStripe()
  const baseUrl = req.nextUrl.origin

  // Find customer by email
  const customers = await stripe.customers.list({ email: parent.email, limit: 1 })
  if (customers.data.length === 0) {
    return NextResponse.json({ error: 'Nu ai un abonament activ' }, { status: 404 })
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${baseUrl}/parinti/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Portal session error:', error)
    return NextResponse.json({ error: 'Eroare la deschiderea portalului' }, { status: 500 })
  }
}
