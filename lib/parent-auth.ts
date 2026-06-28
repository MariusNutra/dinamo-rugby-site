import { createCookieAuth } from '@/lib/cookie-jwt'

export interface ParentTokenPayload {
  type: 'parent'
  parentId: string
  email: string
}

const parentAuth = createCookieAuth({
  type: 'parent' as const,
  cookieName: 'parent_token',
  idField: 'parentId' as const,
})

export const createParentToken = parentAuth.createToken
export const verifyParentToken = parentAuth.verifyToken as (token: string) => ParentTokenPayload | null
export const isParentAuthenticated = parentAuth.isAuthenticated
export const getParentId = parentAuth.getId
