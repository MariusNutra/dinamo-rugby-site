import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { setCsrfCookie } from '@/lib/csrf'

export async function GET() {
  const auth = await isAuthenticated()
  const response = NextResponse.json({ authenticated: auth })
  if (auth) {
    return setCsrfCookie(response)
  }
  return response
}
