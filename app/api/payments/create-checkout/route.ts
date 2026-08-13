import { NextRequest, NextResponse } from 'next/server'
import { getStripe, platileSuntConfigurate, raspunsPlatiIndisponibile } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

const MAX_AMOUNT = 100000 // RON, abuse guard

export async function POST(req: NextRequest) {
  // Fara cheie de plata configurata, `getStripe()` arunca sincron si Next
  // raspunde 500 cu corpul gol. Iesim devreme, cu un mesaj citibil.
  if (!platileSuntConfigurate()) return raspunsPlatiIndisponibile()

  const body = await req.json()
  const { amount, type, childId, campaignId, donorName, email } = body

  if (!amount || typeof amount !== 'number' || amount < 1 || amount > MAX_AMOUNT) {
    return NextResponse.json({ error: 'Suma invalida' }, { status: 400 })
  }

  if (!type || !['cotizatie', 'inscriere', 'donatie'].includes(type)) {
    return NextResponse.json({ error: 'Tip plata invalid' }, { status: 400 })
  }

  // Donations are public/anonymous (campaign-scoped, never attributed to a
  // parent/child). Member fees (cotizatie/inscriere) require an authenticated
  // parent, and the identity is taken from the session — never from the client.
  let parentId: string | null = null
  let safeChildId: string | null = null

  if (type === 'donatie') {
    parentId = null
    safeChildId = null
  } else {
    const sessionParentId = await getParentId()
    if (!sessionParentId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }
    parentId = sessionParentId

    if (childId) {
      // Verify the child belongs to the authenticated parent
      const child = await prisma.child.findFirst({
        where: { id: String(childId), parentId: sessionParentId },
        select: { id: true },
      })
      if (!child) {
        return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
      }
      safeChildId = child.id
    }
  }

  const stripe = getStripe()

  // Create payment record first
  const payment = await prisma.payment.create({
    data: {
      parentId,
      childId: safeChildId,
      amount,
      type,
      status: 'pending',
      description: type === 'donatie'
        ? `Donatie campanie`
        : type === 'cotizatie'
        ? 'Cotizatie lunara'
        : 'Taxa inscriere',
    },
  })

  // Never trust a client-supplied returnUrl (open-redirect via Stripe).
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin

  const lineItemName = type === 'donatie'
    ? 'Donatie - CS Dinamo Bucuresti Rugby'
    : type === 'cotizatie'
    ? 'Cotizatie lunara - CS Dinamo Bucuresti Rugby'
    : 'Taxa inscriere - CS Dinamo Bucuresti Rugby'

  const successUrl = type === 'donatie'
    ? `${baseUrl}/fundraising/succes?status=success&session_id={CHECKOUT_SESSION_ID}`
    : `${baseUrl}/parinti/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`

  const cancelUrl = type === 'donatie'
    ? `${baseUrl}/fundraising/succes?status=cancel`
    : `${baseUrl}/parinti/dashboard?payment=cancel`

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'ron',
          product_data: { name: lineItemName },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email || undefined,
      metadata: {
        paymentId: payment.id,
        type,
        campaignId: campaignId || '',
        childId: safeChildId || '',
        parentId: parentId || '',
        donorName: donorName || '',
      },
    })

    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: session.id },
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'failed' },
    })
    return NextResponse.json({ error: 'Eroare la crearea sesiunii de plata' }, { status: 500 })
  }
}
