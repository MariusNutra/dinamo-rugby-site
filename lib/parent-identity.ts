import { NextRequest } from 'next/server'
import { getParentId } from '@/lib/parent-auth'
import { verifyAppToken } from '@/lib/app-auth'

/**
 * Cine e parintele care face cererea, indiferent pe unde a intrat.
 *
 * Portalul de pe sit trimite cookie (`parent_token`), aplicatia trimite
 * `Authorization: Bearer`. Rutele scrise initial doar pentru sit raspundeau 401
 * aplicatiei, desi tokenul era valid — de aici „nu se salveaza" fara nicio eroare.
 *
 * Tokenul de sportiv poarta acelasi `parentId`, dar NU e parintele: conversatiile
 * dintre parinte si antrenor nu se deschid copilului. De aceea rolul `athlete`
 * e respins aici explicit.
 */
export async function resolveParentId(req?: NextRequest): Promise<string | null> {
  const fromCookie = await getParentId()
  if (fromCookie) return fromCookie

  if (!req) return null

  const payload = verifyAppToken(req)
  if (!payload?.parentId) return null
  if (payload.role !== 'parent') return null

  return payload.parentId
}
