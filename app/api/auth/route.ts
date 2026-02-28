import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

  // Find user in database
  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user || !user.active) {
    return NextResponse.json({ error: 'Credențiale invalide' }, { status: 401 })
  }

  const validPassword = await bcrypt.compare(password || '', user.password)

  if (validPassword) {
    const token = createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    })
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
