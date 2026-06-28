import { NextResponse } from 'next/server'
import { isCoachAuthenticated } from '@/lib/coach-auth'

export async function GET() {
  const auth = await isCoachAuthenticated()
  return NextResponse.json({ authenticated: auth })
}
