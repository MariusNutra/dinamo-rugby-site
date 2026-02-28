import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { items, customerName, email, phone, shippingAddress } = body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cosul este gol' }, { status: 400 })
  }
  if (!customerName || !email) {
    return NextResponse.json({ error: 'Nume si email sunt obligatorii' }, { status: 400 })
  }

  // Fetch and validate products
  const productIds = items.map((i: { productId: string }) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  })

  if (products.length !== items.length) {
    return NextResponse.json({ error: 'Unul sau mai multe produse nu sunt disponibile' }, { status: 400 })
  }

  // Check stock
  for (const item of items) {
    const product = products.find(p => p.id === item.productId)
    if (!product || product.stock < item.quantity) {
      return NextResponse.json({ error: `Stoc insuficient pentru ${product?.name || 'produs'}` }, { status: 400 })
    }
  }

  // Calculate total
  let total = 0
  const orderItemsData = items.map((item: { productId: string; quantity: number }) => {
    const product = products.find(p => p.id === item.productId)!
    total += product.price * item.quantity
    return {
      productId: item.productId,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
    }
  })

  // Create order
  const order = await prisma.order.create({
    data: {
      customerName,
      email,
      phone: phone || null,
      total,
      status: 'noua',
      shippingAddress: shippingAddress || null,
      items: {
        create: orderItemsData,
      },
    },
  })

  // Create Stripe session
  const stripe = getStripe()
  const baseUrl = req.nextUrl.origin

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: orderItemsData.map(item => ({
        price_data: {
          currency: 'ron',
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${baseUrl}/magazin/succes?status=success&order_id=${order.id}`,
      cancel_url: `${baseUrl}/magazin/succes?status=cancel`,
      customer_email: email,
      metadata: {
        orderId: order.id,
        type: 'shop',
      },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    })

    return NextResponse.json({ url: session.url, orderId: order.id })
  } catch (error) {
    console.error('Shop Stripe checkout error:', error)
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'eroare' },
    })
    return NextResponse.json({ error: 'Eroare la crearea sesiunii de plata' }, { status: 500 })
  }
}
