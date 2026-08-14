import { createCookieAuth } from '@/lib/cookie-jwt'
import { prisma } from '@/lib/prisma'

/**
 * Autentificarea portalului de foto (`/foto`).
 *
 * Fotograful e un `User` obisnuit cu rolul `photographer`, ca sa fie creat din
 * ecranul de utilizatori care exista deja. Primeste insa un cookie propriu,
 * NU `admin_token`: asa nu poate ajunge in panoul de administrare nici daca
 * scrie adresa de mana, fiindca `proxy.ts` cere `admin_token` acolo.
 */

export const PHOTOGRAPHER_ROLE = 'photographer'
export const PHOTOGRAPHER_COOKIE = 'photographer_token'

export interface PhotographerTokenPayload {
  type: 'photographer'
  photographerId: string
  email: string
}

const photographerAuth = createCookieAuth({
  type: 'photographer' as const,
  cookieName: PHOTOGRAPHER_COOKIE,
  idField: 'photographerId' as const,
})

export const createPhotographerToken = photographerAuth.createToken
export const verifyPhotographerToken = photographerAuth.verifyToken as (
  token: string
) => PhotographerTokenPayload | null
export const isPhotographerAuthenticated = photographerAuth.isAuthenticated

/**
 * Id-ul fotografului logat, sau null. Verifica de fiecare data in baza ca
 * mai are rolul si contul activ — un token ramane valabil 7 zile, deci
 * altfel un cont dezactivat ar continua sa incarce pana expira tokenul.
 */
export async function getPhotographerId(): Promise<number | null> {
  const raw = await photographerAuth.getId()
  if (!raw) return null

  const id = Number(raw)
  if (!Number.isInteger(id)) return null

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, active: true, role: true },
  })

  if (!user || !user.active || user.role !== PHOTOGRAPHER_ROLE) return null

  return user.id
}
