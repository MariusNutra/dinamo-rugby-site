import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createParentToken } from '@/lib/parent-auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * POST /api/parinti/login
 *
 * Password login for the WEB parent portal. The mobile app uses
 * /api/auth/login, which returns a Bearer JWT; the web portal authenticates
 * with the httpOnly `parent_token` cookie instead, so it needs its own route
 * rather than reusing the mobile one.
 *
 * The magic-link flow (/api/parinti/auth) stays as the passwordless entry and
 * as the recovery path for parents who never set a password.
 */

// Dummy hash used to keep the response time roughly constant when the email is
// unknown or has no password set — otherwise the endpoint leaks which emails
// are registered through timing alone.
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.wjNfLNvJ1cLBFrCRw1KZ.uJgqNQZ4ZS'

const NEUTRAL_ERROR = 'Email sau parola gresita.'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  const limit = await checkRateLimit(ip, {
    action: 'parinti_login',
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Prea multe incercari. Reincearca mai tarziu.' },
      { status: 429 }
    )
  }

  let email: unknown, password: unknown
  try {
    const body = await req.json()
    email = body.email
    password = body.password
  } catch {
    return NextResponse.json({ error: 'Date invalide.' }, { status: 400 })
  }

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return NextResponse.json(
      { error: 'Email-ul si parola sunt obligatorii.' },
      { status: 400 }
    )
  }

  const normalizedEmail = email.toLowerCase().trim()

  const parent = await prisma.parent.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, password: true },
  })

  // Always run a bcrypt comparison, even with no matching parent.
  const validPassword = await bcrypt.compare(password, parent?.password ?? DUMMY_HASH)

  if (!parent || !parent.password || !validPassword) {
    // Second rate-limit bucket keyed by email so an attacker cannot spread a
    // per-account brute force across many IPs unnoticed.
    await checkRateLimit(`email:${normalizedEmail}`, {
      action: 'parinti_login_email',
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000,
    })
    return NextResponse.json({ error: NEUTRAL_ERROR }, { status: 401 })
  }

  const token = createParentToken(parent.id, parent.email)
  const response = NextResponse.json({ success: true })

  response.cookies.set('parent_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days — same as the magic-link session
    path: '/',
  })

  return response
}
