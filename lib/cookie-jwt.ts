import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

/**
 * Shared factory for cookie-based JWT auth used by the parent and coach web
 * portals. Both portals issue a 7-day JWT carrying a `type` discriminator plus
 * an id field, stored in an httpOnly cookie. This factory removes the
 * copy-pasted create/verify/isAuthenticated/getId logic; each portal module
 * just calls it with its own type, cookie name and id field and re-exports the
 * result under its existing public names (so call sites are unchanged).
 *
 * Admin auth (lib/auth.ts) and the mobile Bearer flow (lib/app-auth.ts) are
 * intentionally NOT built on this — they have different payload shapes and
 * transports.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  return secret
}

export function createCookieAuth<TType extends string, TIdKey extends string>(opts: {
  type: TType
  cookieName: string
  idField: TIdKey
}) {
  type Payload = { type: TType; email: string } & { [K in TIdKey]: string }

  function createToken(id: string, email: string): string {
    return jwt.sign(
      { type: opts.type, [opts.idField]: id, email },
      getJwtSecret(),
      { expiresIn: '7d' }
    )
  }

  function verifyToken(token: string): Payload | null {
    try {
      const payload = jwt.verify(token, getJwtSecret()) as Payload
      if (payload.type !== opts.type) return null
      return payload
    } catch {
      return null
    }
  }

  async function isAuthenticated(): Promise<boolean> {
    const token = (await cookies()).get(opts.cookieName)?.value
    if (!token) return false
    return verifyToken(token) !== null
  }

  async function getId(): Promise<string | null> {
    const token = (await cookies()).get(opts.cookieName)?.value
    if (!token) return null
    const payload = verifyToken(token)
    return (payload?.[opts.idField] as string | undefined) ?? null
  }

  return { createToken, verifyToken, isAuthenticated, getId }
}
