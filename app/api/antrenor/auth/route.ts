import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCoachToken } from '@/lib/coach-auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = await checkRateLimit(ip, { action: 'coach_login', maxAttempts: 10, windowMs: 15 * 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: `Prea multe incercari. Reincercati in ${rl.retryAfterSeconds}s.` }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { email, password } = body as { email?: string; password?: string }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email si parola sunt obligatorii.' }, { status: 400 })
  }

  const emailLower = email.trim().toLowerCase()
  const coach = await prisma.coach.findUnique({ where: { email: emailLower } })

  if (!coach || !coach.password) {
    return NextResponse.json({ error: 'Email sau parola incorecte.' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, coach.password)
  if (!valid) {
    return NextResponse.json({ error: 'Email sau parola incorecte.' }, { status: 401 })
  }

  const token = createCoachToken(coach.id, coach.email!)
  const response = NextResponse.json({ success: true, redirect: '/antrenor/dashboard' })
  response.cookies.set('coach_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return response
}
