import { createCookieAuth } from '@/lib/cookie-jwt'

/**
 * Sesiunea sportivului pe web.
 *
 * Foloseste aceeasi fabrica de cookie-uri ca parintii si antrenorii, cu propriul
 * tip in incarcatura: un token de sportiv nu trece drept token de parinte si
 * invers, chiar daca semnatura e aceeasi.
 *
 * Sportivul e legat de UN copil (`childId`), spre deosebire de parinte, care
 * poate avea mai multi. Campul `email` din incarcatura tine numele de
 * utilizator — sportivii nu au adresa de email, si nici nu vrem sa aiba.
 */
export interface AthleteTokenPayload {
  type: 'athlete'
  childId: string
  email: string
}

const athleteAuth = createCookieAuth({
  type: 'athlete' as const,
  cookieName: 'athlete_token',
  idField: 'childId' as const,
})

export const createAthleteToken = athleteAuth.createToken
export const verifyAthleteToken = athleteAuth.verifyToken as (token: string) => AthleteTokenPayload | null
export const isAthleteAuthenticated = athleteAuth.isAuthenticated
export const getAthleteChildId = athleteAuth.getId
