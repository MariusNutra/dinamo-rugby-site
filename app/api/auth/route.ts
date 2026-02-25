import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createToken } from '@/lib/auth'

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  // Rate limiting
  const now = Date.now()
  const record = loginAttempts.get(ip)
  if (record) {
    if (now - record.lastAttempt > WINDOW_MS) {
      loginAttempts.delete(ip)
    } else if (record.count >= MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((WINDOW_MS - (now - record.lastAttempt)) / 1000)
      return NextResponse.json(
        { error: `Prea multe încercări. Reîncearcă peste ${Math.ceil(retryAfter / 60)} minute.` },
        { status: 429 }
      )
    }
  }

  const { username, password } = await req.json()

  const validUsername = username === process.env.ADMIN_USERNAME
  const passwordHash = process.env.ADMIN_PASSWORD_HASH || ''
  const validPassword = passwordHash ? await bcrypt.compare(password || '', passwordHash) : false

  if (validUsername && validPassword) {
    loginAttempts.delete(ip)
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

  // Track failed attempt
  const current = loginAttempts.get(ip)
  loginAttempts.set(ip, {
    count: (current?.count || 0) + 1,
    lastAttempt: now,
  })

  return NextResponse.json({ error: 'Credențiale invalide' }, { status: 401 })
}
