import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

interface ApiKeyRecord {
  id: string
  name: string
  key: string
  permissions: string
  rateLimitPerMinute: number
  lastUsedAt: Date | null
  createdBy: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

interface ValidateResult {
  valid: boolean
  apiKey?: ApiKeyRecord
  error?: string
}

/**
 * Validate an API key from request headers or query params.
 * Checks: key exists, is active, rate limit not exceeded.
 * Updates lastUsedAt on success.
 */
export async function validateApiKey(request: NextRequest): Promise<ValidateResult> {
  // Extract key from header or query param
  const headerKey = request.headers.get('X-API-Key')
  const url = new URL(request.url)
  const queryKey = url.searchParams.get('api_key')
  const key = headerKey || queryKey

  if (!key) {
    return { valid: false, error: 'API key is required. Provide it via X-API-Key header or ?api_key= query param.' }
  }

  // Look up the key
  let apiKey: ApiKeyRecord | null
  try {
    apiKey = await prisma.apiKey.findUnique({ where: { key } })
  } catch (err) {
    console.error('API key lookup failed:', err)
    return { valid: false, error: 'Internal server error during authentication.' }
  }

  if (!apiKey) {
    return { valid: false, error: 'Invalid API key.' }
  }

  if (!apiKey.active) {
    return { valid: false, error: 'API key is inactive.' }
  }

  // Rate limit check
  const clientIp = getClientIp(request)
  const rateLimitKey = `apikey:${apiKey.id}:${clientIp}`
  const rateResult = await checkRateLimit(rateLimitKey, {
    action: 'api_request',
    maxAttempts: apiKey.rateLimitPerMinute,
    windowMs: 60 * 1000, // 1 minute
  })

  if (!rateResult.allowed) {
    return {
      valid: false,
      error: `Rate limit exceeded. Try again in ${rateResult.retryAfterSeconds} seconds.`,
    }
  }

  // Update lastUsedAt (fire and forget)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch((err) => {
    console.error('Failed to update lastUsedAt:', err)
  })

  return { valid: true, apiKey }
}

/**
 * Check if an API key has permission for a given endpoint.
 * An empty permissions array means all endpoints are allowed.
 */
export function checkEndpointPermission(apiKey: ApiKeyRecord, endpoint: string): boolean {
  let permissions: string[]
  try {
    const parsed = JSON.parse(apiKey.permissions)
    permissions = Array.isArray(parsed) ? parsed : []
  } catch {
    permissions = []
  }

  // Empty array = all endpoints allowed
  if (permissions.length === 0) {
    return true
  }

  return permissions.includes(endpoint)
}
