import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  return secret
}

interface ParentTokenPayload {
  role: 'parent'
  parentId: string
}

export function createParentToken(parentId: string): string {
  return jwt.sign({ role: 'parent', parentId }, getJwtSecret(), { expiresIn: '30d' })
}

export function verifyParentToken(token: string): ParentTokenPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as ParentTokenPayload
    if (payload.role !== 'parent') return null
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
