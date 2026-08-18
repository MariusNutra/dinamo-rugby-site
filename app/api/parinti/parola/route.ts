import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'
import { validatePassword } from '@/lib/password-policy'
import { revokeAllRefreshTokens } from '@/lib/unified-auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * POST /api/parinti/parola
 *
 * Lets a parent who is already signed in on the web portal set a first
 * password or change an existing one. Authentication is the `parent_token`
 * cookie — /api/auth/set-password only accepts a Bearer JWT or a magic-link
 * token, neither of which the web portal holds once the session cookie is set.
 *
 * Setting a first password needs no current password: reaching this route
 * already required a valid session, which itself came from a single-use magic
 * link sent to the parent's own inbox.
 */
export async function POST(req: NextRequest) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const limit = await checkRateLimit(getClientIp(req), {
    action: 'parinti_set_password',
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Prea multe incercari. Reincearca mai tarziu.' },
      { status: 429 }
    )
  }

  let password: unknown, currentPassword: unknown
  try {
    const body = await req.json()
    password = body.password
    currentPassword = body.currentPassword
  } catch {
    return NextResponse.json({ error: 'Date invalide.' }, { status: 400 })
  }

  const check = validatePassword(password)
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 })
  }

  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    select: { id: true, password: true },
  })
  if (!parent) {
    return NextResponse.json({ error: 'Parinte negasit' }, { status: 404 })
  }

  const isChange = Boolean(parent.password)

  if (isChange) {
    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json(
        { error: 'Introdu parola actuala pentru a o schimba.' },
        { status: 400 }
      )
    }
    const valid = await bcrypt.compare(currentPassword, parent.password as string)
    if (!valid) {
      return NextResponse.json({ error: 'Parola actuala este gresita.' }, { status: 400 })
    }
  }

  await prisma.parent.update({
    where: { id: parentId },
    data: {
      password: await bcrypt.hash(password as string, 12),
      mustChangePassword: false,
      // Drop any outstanding magic link — it is no longer the way in.
      token: null,
      tokenExpiry: null,
    },
  })

  // A password change invalidates sessions on other devices (mobile app
  // included). Setting a first password does not, so a parent who is mid-setup
  // on their phone is not kicked out for no reason.
  if (isChange) {
    await revokeAllRefreshTokens({ parentId })
  }

  return NextResponse.json({
    success: true,
    message: isChange ? 'Parola a fost schimbata.' : 'Parola a fost setata.',
  })
}
