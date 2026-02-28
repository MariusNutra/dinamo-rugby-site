import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { isAdmin } from '@/lib/auth'

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const stripe = getStripe()

    // Get all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'all',
      limit: 100,
      expand: ['data.customer'],
    })

    const formatted = subscriptions.data.map(sub => {
      const customer = sub.customer as unknown as { id: string; email?: string; name?: string }
      const subAny = sub as unknown as Record<string, unknown>
      const periodStart = (subAny.current_period_start ?? subAny.currentPeriodStart) as number
      const periodEnd = (subAny.current_period_end ?? subAny.currentPeriodEnd) as number
      const cancelAt = (subAny.canceled_at ?? subAny.canceledAt) as number | null
      const created = (subAny.created ?? subAny.createdAt) as number
      return {
        id: sub.id,
        status: sub.status,
        customerEmail: customer.email || '',
        customerName: customer.name || '',
        childName: sub.metadata?.childName || '',
        amount: sub.items.data[0]?.price?.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 0,
        currency: sub.items.data[0]?.price?.currency || 'ron',
        currentPeriodStart: periodStart ? new Date(periodStart * 1000).toISOString() : '',
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : '',
        canceledAt: cancelAt ? new Date(cancelAt * 1000).toISOString() : null,
        createdAt: created ? new Date(created * 1000).toISOString() : '',
      }
    })

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error)
    return NextResponse.json({ error: 'Eroare la încărcarea abonamentelor' }, { status: 500 })
  }
}
