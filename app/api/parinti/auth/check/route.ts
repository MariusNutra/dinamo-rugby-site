import { NextResponse } from 'next/server'
import { isParentAuthenticated } from '@/lib/parent-auth'

export async function GET() {
  const auth = await isParentAuthenticated()
  return NextResponse.json({ authenticated: auth })
}
