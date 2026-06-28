import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCoachToken } from '@/lib/coach-auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = await checkRateLimit(ip, { action: 'coach_register', maxAttempts: 5, windowMs: 15 * 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: `Prea multe incercari. Reincercati in ${rl.retryAfterSeconds}s.` }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { name, email, phone, password } = body as {
    name?: string; email?: string; phone?: string; password?: string
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'Numele este obligatoriu (min 2 caractere).' }, { status: 400 })
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Email-ul este obligatoriu.' }, { status: 400 })
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: 'Parola trebuie sa aiba minim 6 caractere.' }, { status: 400 })
  }

  const emailLower = email.trim().toLowerCase()

  // Account activation only: an admin must have pre-created the coach record
  // (with the team assignment). Self-registration cannot create a new coach or
  // pick a team — that was an open privilege-escalation vector.
  const existing = await prisma.coach.findUnique({ where: { email: emailLower } })
  if (!existing) {
    return NextResponse.json(
      { error: 'Nu exista un cont de antrenor pentru acest email. Contactati administratorul.' },
      { status: 403 }
    )
  }
  if (existing.password) {
    return NextResponse.json(
      { error: 'Acest cont are deja o parola. Folositi pagina de autentificare.' },
      { status: 409 }
    )
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  // teamId is intentionally NOT taken from the client — it stays as set by admin.
  const coach = await prisma.coach.update({
    where: { id: existing.id },
    data: {
      name: name.trim(),
      phone: phone ? String(phone).trim() : existing.phone,
      password: hashedPassword,
      mustChangePassword: false,
    },
  })

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
