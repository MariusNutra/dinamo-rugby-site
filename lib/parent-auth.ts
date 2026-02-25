import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  return secret
}

interface ParentTokenPayload {
  type: 'parent'
  parentId: string
  email: string
}

export function createParentToken(parentId: string, email: string): string {
  return jwt.sign({ type: 'parent', parentId, email }, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyParentToken(token: string): ParentTokenPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as ParentTokenPayload
    if (payload.type !== 'parent') return null
    return payload
  } catch {
    return null
  }
}

export async function isParentAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('parent_token')?.value
  if (!token) return false
  return verifyParentToken(token) !== null
}

export async function getParentId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('parent_token')?.value
  if (!token) return null
  const payload = verifyParentToken(token)
  return payload?.parentId ?? null
}
