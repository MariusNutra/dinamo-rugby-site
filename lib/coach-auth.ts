import { createCookieAuth } from '@/lib/cookie-jwt'

export interface CoachTokenPayload {
  type: 'coach'
  coachId: string
  email: string
}

const coachAuth = createCookieAuth({
  type: 'coach' as const,
  cookieName: 'coach_token',
  idField: 'coachId' as const,
})

export const createCoachToken = coachAuth.createToken
export const verifyCoachToken = coachAuth.verifyToken as (token: string) => CoachTokenPayload | null
export const isCoachAuthenticated = coachAuth.isAuthenticated
export const getCoachId = coachAuth.getId
