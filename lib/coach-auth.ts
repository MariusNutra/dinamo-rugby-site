import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  return secret
}

interface CoachTokenPayload {
  type: 'coach'
  coachId: string
  email: string
}

export function createCoachToken(coachId: string, email: string): string {
  return jwt.sign({ type: 'coach', coachId, email }, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyCoachToken(token: string): CoachTokenPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as CoachTokenPayload
    if (payload.type !== 'coach') return null
    return payload
  } catch {
    return null
  }
}

export async function isCoachAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('coach_token')?.value
  if (!token) return false
  return verifyCoachToken(token) !== null
}

export async function getCoachId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('coach_token')?.value
  if (!token) return null
  const payload = verifyCoachToken(token)
  return payload?.coachId ?? null
}
