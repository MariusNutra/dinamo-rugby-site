import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createAthleteToken } from '@/lib/athlete-auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * Logarea sportivului: nume de utilizator + parola, ambele date de parinte.
 * Fara email si fara recuperare de parola pe email — copilul nu are adresa;
 * daca uita parola, parintele i-o schimba din portalul lui.
 */

const HASH_FALS = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.wjNfLNvJ1cLBFrCRw1KZ.uJgqNQZ4ZS'
const EROARE_NEUTRA = 'Utilizator sau parola gresita.'

export async function POST(req: NextRequest) {
  const limita = await checkRateLimit(getClientIp(req), {
    action: 'sportiv_login',
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
  })
  if (!limita.allowed) {
    return NextResponse.json({ error: 'Prea multe incercari. Reincearca mai tarziu.' }, { status: 429 })
  }

  let username: unknown, password: unknown
  try {
    const body = await req.json()
    username = body.username
    password = body.password
  } catch {
    return NextResponse.json({ error: 'Date invalide.' }, { status: 400 })
  }

  if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Utilizatorul si parola sunt obligatorii.' }, { status: 400 })
  }

  const numeNormalizat = username.toLowerCase().trim()

  const child = await prisma.child.findUnique({
    where: { username: numeNormalizat },
    select: { id: true, username: true, password: true, accessEnabled: true },
  })

  // Comparam mereu, chiar si fara potrivire: altfel timpul de raspuns spune
  // singur ce nume de utilizator exista.
  const parolaBuna = await bcrypt.compare(password, child?.password ?? HASH_FALS)

  if (!child || !child.accessEnabled || !child.password || !parolaBuna) {
    await checkRateLimit(`user:${numeNormalizat}`, {
      action: 'sportiv_login_user',
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000,
    })
    return NextResponse.json({ error: EROARE_NEUTRA }, { status: 401 })
  }

  const token = createAthleteToken(child.id, child.username as string)
  const raspuns = NextResponse.json({ success: true })
  raspuns.cookies.set('athlete_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return raspuns
}
