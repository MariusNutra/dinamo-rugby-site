import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authz'
import { getOverviewAlerts } from '@/lib/ai/coach-assistant'

export async function GET() {
  const authz = await requirePermission('athletes.view')
  if (authz.error) return authz.error

  try {
    const alerts = await getOverviewAlerts()
    return NextResponse.json({ alerts })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare interna'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
