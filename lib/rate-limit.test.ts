import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Prisma client before importing the module under test.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    rateLimit: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { checkRateLimit } from './rate-limit'

const rl = prisma.rateLimit as unknown as {
  findUnique: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
}

const config = { action: 'login', maxAttempts: 3, windowMs: 60_000 }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('checkRateLimit', () => {
  it('allows and creates a record on first attempt', async () => {
    rl.findUnique.mockResolvedValue(null)
    rl.create.mockResolvedValue({})

    const res = await checkRateLimit('1.2.3.4', config)

    expect(res.allowed).toBe(true)
    expect(res.remaining).toBe(2)
    expect(rl.create).toHaveBeenCalledOnce()
  })

  it('allows and increments while under the limit', async () => {
    rl.findUnique.mockResolvedValue({
      id: 1, count: 1, windowStart: new Date(),
    })
    rl.update.mockResolvedValue({})

    const res = await checkRateLimit('1.2.3.4', config)

    expect(res.allowed).toBe(true)
    expect(res.remaining).toBe(1)
  })

  it('denies once the limit is reached within the window', async () => {
    rl.findUnique.mockResolvedValue({
      id: 1, count: 3, windowStart: new Date(),
    })

    const res = await checkRateLimit('1.2.3.4', config)

    expect(res.allowed).toBe(false)
    expect(res.remaining).toBe(0)
    expect(res.retryAfterSeconds).toBeGreaterThan(0)
    expect(rl.update).not.toHaveBeenCalled()
  })

  it('resets the window when the previous one expired', async () => {
    rl.findUnique.mockResolvedValue({
      id: 1, count: 99, windowStart: new Date(Date.now() - 120_000),
    })
    rl.update.mockResolvedValue({})

    const res = await checkRateLimit('1.2.3.4', config)

    expect(res.allowed).toBe(true)
    expect(res.remaining).toBe(2)
  })

  it('FAILS CLOSED when the store throws (no silent bypass)', async () => {
    rl.findUnique.mockRejectedValue(new Error('db down'))

    const res = await checkRateLimit('1.2.3.4', config)

    expect(res.allowed).toBe(false)
    expect(res.remaining).toBe(0)
    expect(res.retryAfterSeconds).toBe(60)
  })
})
