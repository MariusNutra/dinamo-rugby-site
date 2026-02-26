import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { amount, type, childId, campaignId, parentId, returnUrl, donorName, email } = body

  if (!amount || typeof amount !== 'number' || amount < 1) {
    return NextResponse.json({ error: 'Suma invalida' }, { status: 400 })
  }

  if (!type || !['cotizatie', 'inscriere', 'donatie'].includes(type)) {
    return NextResponse.json({ error: 'Tip plata invalid' }, { status: 400 })
  }

  const stripe = getStripe()

  // Create payment record first
  const payment = await prisma.payment.create({
    data: {
      parentId: parentId || null,
      childId: childId || null,
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

  const baseUrl = returnUrl || req.nextUrl.origin

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
        childId: childId || '',
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
