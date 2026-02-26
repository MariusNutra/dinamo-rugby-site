import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createToken } from '@/lib/auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  // Persistent rate limiting
  const limit = await checkRateLimit(ip, {
    action: 'admin_login',
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  })

  if (!limit.allowed) {
    const minutes = Math.ceil((limit.retryAfterSeconds || 60) / 60)
    return NextResponse.json(
      { error: `Prea multe încercări. Reîncearcă peste ${minutes} minute.` },
      { status: 429 }
    )
  }

  const { username, password } = await req.json()

  const validUsername = username === process.env.ADMIN_USERNAME
  const passwordHash = process.env.ADMIN_PASSWORD_HASH || ''
  const validPassword = passwordHash ? await bcrypt.compare(password || '', passwordHash) : false

  if (validUsername && validPassword) {
    const token = createToken()
    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  }

  return NextResponse.json({ error: 'Credențiale invalide' }, { status: 401 })
}
