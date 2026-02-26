import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
})

function generateReceiptNumber(): string {
  const date = new Date()
  const prefix = `DR${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${random}`
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const stripe = getStripe()
  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      id: string
      metadata: Record<string, string>
      customer_email?: string | null
      amount_total?: number | null
    }

    const { paymentId, type, campaignId, donorName } = session.metadata
    const receiptNumber = generateReceiptNumber()

    // Update payment record
    if (paymentId) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'completed',
          receiptNumber,
          stripeSessionId: session.id,
        },
      })
    }

    // If donation, update campaign and create donation record
    if (type === 'donatie' && campaignId) {
      const amount = (session.amount_total || 0) / 100

      await prisma.donation.create({
        data: {
          campaignId,
          donorName: donorName || null,
          email: session.customer_email || null,
          amount,
          anonymous: !donorName,
          paymentMethod: 'stripe',
          stripeSessionId: session.id,
          status: 'completed',
        },
      })

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { currentAmount: { increment: amount } },
      })
    }

    // Send confirmation email
    const email = session.customer_email
    if (email) {
      const amount = ((session.amount_total || 0) / 100).toLocaleString('ro-RO')
      const typeLabel = type === 'donatie' ? 'Donatie' : type === 'cotizatie' ? 'Cotizatie lunara' : 'Taxa inscriere'

      try {
        await transporter.sendMail({
          from: '"CS Dinamo București Rugby" <contact@dinamorugby.ro>',
          to: email,
          subject: `Confirmare plata - CS Dinamo București Rugby`,
          text: `Plata dumneavoastra a fost procesata cu succes.\n\nTip: ${typeLabel}\nSuma: ${amount} RON\nNr. referinta: ${receiptNumber}\n\nVa multumim!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #1e3a5f; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 20px;">CS Dinamo București Rugby</h1>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #1e3a5f; margin-top: 0;">Confirmare plata</h2>
                <p>Plata dumneavoastra a fost procesata cu succes.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Tip plata</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">${typeLabel}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Suma</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #c62828;">${amount} RON</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Data</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${new Date().toLocaleDateString('ro-RO')}</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Nr. referinta</td><td style="padding: 8px 0; font-family: monospace;">${receiptNumber}</td></tr>
                </table>
                <p style="color: #666; font-size: 14px;">Va multumim pentru sprijin! 🏉</p>
              </div>
              <div style="padding: 15px; text-align: center; color: #999; font-size: 12px;">
                CS Dinamo București Rugby - Sectia Juniori
              </div>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr)
      }
    }
  }

  return NextResponse.json({ received: true })
}
