/**
 * CSRF protection using double-submit cookie pattern.
 * Compatible with Next.js App Router.
 *
 * Usage in API routes:
 *   import { validateCsrf } from '@/lib/csrf'
 *   const csrfError = validateCsrf(req)
 *   if (csrfError) return csrfError
 *
 * Usage in client forms:
 *   import { getCsrfToken } from '@/lib/csrf-client'
 *   fetch('/api/...', { headers: { 'x-csrf-token': getCsrfToken() } })
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'

const CSRF_COOKIE = 'csrf_token'
const CSRF_HEADER = 'x-csrf-token'

/**
 * Generate a cryptographically secure CSRF token.
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Hash a CSRF token for comparison (prevents timing attacks).
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Validate CSRF token from request.
 * Compares the token in the cookie with the token in the header.
 * Returns NextResponse error if invalid, null if valid.
 */
export function validateCsrf(req: NextRequest): NextResponse | null {
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return null
  }

  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value
  const headerToken = req.headers.get(CSRF_HEADER)

  if (!cookieToken || !headerToken) {
    return NextResponse.json(
      { error: 'Token CSRF lipsă. Reîncarcă pagina și încearcă din nou.' },
      { status: 403 }
    )
  }

  // Compare hashes to prevent timing attacks
  if (hashToken(cookieToken) !== hashToken(headerToken)) {
    return NextResponse.json(
      { error: 'Token CSRF invalid. Reîncarcă pagina și încearcă din nou.' },
      { status: 403 }
    )
  }

  return null
}

/**
 * Create a response with CSRF cookie set.
 * Call this on GET endpoints or page loads to set the token.
 */
export function setCsrfCookie(response: NextResponse): NextResponse {
  const token = generateCsrfToken()
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false, // Must be readable by JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })
  return response
}
