import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function POST(req: NextRequest) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { childId } = await req.json()
  if (!childId) {
    return NextResponse.json({ error: 'childId lipsă' }, { status: 400 })
  }

  // Verify child belongs to parent
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId },
    include: { team: { select: { grupa: true } } },
  })

  if (!child) {
    return NextResponse.json({ error: 'Sportiv negăsit' }, { status: 404 })
  }

  const parent = await prisma.parent.findUnique({ where: { id: parentId } })
  if (!parent) {
    return NextResponse.json({ error: 'Părinte negăsit' }, { status: 404 })
  }

  const stripe = getStripe()
  const baseUrl = req.nextUrl.origin

  try {
    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({ email: parent.email, limit: 1 })
    let customerId: string

    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: parent.email,
        name: parent.name,
        metadata: { parentId, childId },
      })
      customerId = customer.id
    }

    // Create a price for monthly subscription (200 RON/month)
    // Use lookup_key to reuse the same price
    const prices = await stripe.prices.list({
      lookup_keys: ['cotizatie_lunara_200'],
      limit: 1,
    })

    let priceId: string

    if (prices.data.length > 0) {
      priceId = prices.data[0].id
    } else {
      // Create the product and price
      const product = await stripe.products.create({
        name: 'Cotizație lunară - CS Dinamo București Rugby',
        description: `Cotizația lunară pentru ${child.name}${child.team ? ` (${child.team.grupa})` : ''}`,
      })

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 20000, // 200 RON in bani
        currency: 'ron',
        recurring: { interval: 'month' },
        lookup_key: 'cotizatie_lunara_200',
      })

      priceId = price.id
    }

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${baseUrl}/parinti/dashboard?subscription=success`,
      cancel_url: `${baseUrl}/parinti/dashboard?subscription=cancel`,
      metadata: {
        parentId,
        childId,
        type: 'subscription',
      },
      subscription_data: {
        metadata: {
          parentId,
          childId,
          childName: child.name,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Subscription checkout error:', error)
    return NextResponse.json({ error: 'Eroare la crearea abonamentului' }, { status: 500 })
  }
}
