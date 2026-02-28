import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

interface AppTokenPayload {
  parentId: string
  email: string
  role: string
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is required')
  return secret
}

/**
 * Verify a Bearer JWT token from the mobile app.
 * Returns the decoded payload or null if invalid.
 */
export function verifyAppToken(req: NextRequest): AppTokenPayload | null {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  try {
    return jwt.verify(authHeader.slice(7), getJwtSecret()) as AppTokenPayload
  } catch {
    return null
  }
}
