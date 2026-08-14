import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import {
  createPhotographerToken,
  PHOTOGRAPHER_COOKIE,
  PHOTOGRAPHER_ROLE,
} from '@/lib/photographer-auth'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = await checkRateLimit(ip, {
    action: 'photographer_login',
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Prea multe incercari. Reincercati in ${rl.retryAfterSeconds}s.` },
      { status: 429 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { username, password } = body as { username?: string; password?: string }

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Utilizatorul si parola sunt obligatorii.' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { username: String(username).trim() },
  })

  // Acelasi mesaj pentru user inexistent, parola gresita, cont dezactivat sau
  // rol gresit: altfel formularul devine un mod de a afla ce conturi exista.
  const invalid = NextResponse.json(
    { error: 'Utilizator sau parola incorecte.' },
    { status: 401 }
  )

  if (!user || !user.active || user.role !== PHOTOGRAPHER_ROLE) return invalid

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return invalid

  const token = createPhotographerToken(String(user.id), user.email || user.username)
  const response = NextResponse.json({ success: true, redirect: '/foto/media' })
  response.cookies.set(PHOTOGRAPHER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(PHOTOGRAPHER_COOKIE, '', { maxAge: 0, path: '/' })
  return response
}
