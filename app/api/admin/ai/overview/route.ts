import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { getOverviewAlerts } from '@/lib/ai/coach-assistant'

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const alerts = await getOverviewAlerts()
    return NextResponse.json({ alerts })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare interna'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
