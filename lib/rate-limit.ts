import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

interface RateLimitConfig {
  /** Unique action name (e.g., 'admin_login', 'contact_form') */
  action: string
  /** Max attempts allowed in the window */
  maxAttempts: number
  /** Time window in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds?: number
}

export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

/**
 * Check and increment rate limit for a given key+action.
 * Uses the database so limits persist across PM2 restarts.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { action, maxAttempts, windowMs } = config
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMs)

  try {
    const record = await prisma.rateLimit.findUnique({
      where: { key_action: { key, action } },
    })

    if (record) {
      // Window expired — reset
      if (record.windowStart < windowStart) {
        await prisma.rateLimit.update({
          where: { id: record.id },
          data: { count: 1, windowStart: now },
        })
        return { allowed: true, remaining: maxAttempts - 1 }
      }

      // Within window — check limit
      if (record.count >= maxAttempts) {
        const retryAfterMs = windowMs - (now.getTime() - record.windowStart.getTime())
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
        }
      }

      // Increment
      await prisma.rateLimit.update({
        where: { id: record.id },
        data: { count: record.count + 1 },
      })
      return { allowed: true, remaining: maxAttempts - (record.count + 1) }
    }

    // No record — create
    await prisma.rateLimit.create({
      data: { key, action, count: 1, windowStart: now },
    })
    return { allowed: true, remaining: maxAttempts - 1 }
  } catch (error) {
    // If DB fails, allow the request (fail open) but log
    console.error('Rate limit check failed:', error)
    return { allowed: true, remaining: maxAttempts }
  }
}

/**
 * Clean up expired rate limit records (call periodically).
 */
export async function cleanupRateLimits(): Promise<void> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  try {
    await prisma.rateLimit.deleteMany({
      where: { windowStart: { lt: oneDayAgo } },
    })
  } catch (error) {
    console.error('Rate limit cleanup failed:', error)
  }
}
