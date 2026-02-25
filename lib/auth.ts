import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  return secret
}

export function createToken(): string {
  return jwt.sign({ role: 'admin' }, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, getJwtSecret())
    return true
  } catch {
    return false
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return false
  return verifyToken(token)
}
