import { NextResponse } from 'next/server'
import { getModuleSettings } from '@/lib/modules'

export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = await getModuleSettings()

  return NextResponse.json(settings, {
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  })
}
