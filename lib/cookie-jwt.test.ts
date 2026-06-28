import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'

// Mock next/headers so we can drive cookie reads in isAuthenticated/getId.
vi.mock('next/headers', () => ({ cookies: vi.fn() }))
import { cookies } from 'next/headers'

import { createCookieAuth } from './cookie-jwt'

const SECRET = 'test-secret-for-cookie-jwt'

function mockCookie(name: string, value: string | undefined) {
  ;(cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    get: (n: string) => (n === name && value ? { value } : undefined),
  })
}

const coach = createCookieAuth({ type: 'coach' as const, cookieName: 'coach_token', idField: 'coachId' as const })
const parent = createCookieAuth({ type: 'parent' as const, cookieName: 'parent_token', idField: 'parentId' as const })

describe('createCookieAuth', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = SECRET
    vi.clearAllMocks()
  })

  it('round-trips a token: createToken payload is recovered by verifyToken', () => {
    const token = coach.createToken('c123', 'coach@example.com')
    const payload = coach.verifyToken(token) as Record<string, string> | null
    expect(payload).toMatchObject({ type: 'coach', coachId: 'c123', email: 'coach@example.com' })
  })

  it('rejects a token whose type does not match (coach token via parent auth)', () => {
    const coachToken = coach.createToken('c123', 'coach@example.com')
    expect(parent.verifyToken(coachToken)).toBeNull()
  })

  it('returns null for a garbage/tampered token', () => {
    expect(coach.verifyToken('not-a-jwt')).toBeNull()
    const token = coach.createToken('c123', 'coach@example.com')
    expect(coach.verifyToken(token + 'x')).toBeNull()
  })

  it('returns null for a token signed with a different secret', () => {
    const foreign = jwt.sign({ type: 'coach', coachId: 'c123', email: 'x@y.z' }, 'other-secret')
    expect(coach.verifyToken(foreign)).toBeNull()
  })

  it('throws if JWT_SECRET is missing when signing', () => {
    delete process.env.JWT_SECRET
    expect(() => coach.createToken('c1', 'a@b.c')).toThrow(/JWT_SECRET/)
  })

  it('getId extracts the id field from a valid cookie token', async () => {
    const token = coach.createToken('c777', 'coach@example.com')
    mockCookie('coach_token', token)
    expect(await coach.getId()).toBe('c777')
  })

  it('getId returns null when no cookie is present', async () => {
    mockCookie('coach_token', undefined)
    expect(await coach.getId()).toBeNull()
  })

  it('isAuthenticated reflects cookie validity', async () => {
    const token = coach.createToken('c1', 'a@b.c')
    mockCookie('coach_token', token)
    expect(await coach.isAuthenticated()).toBe(true)
    mockCookie('coach_token', undefined)
    expect(await coach.isAuthenticated()).toBe(false)
  })
})
