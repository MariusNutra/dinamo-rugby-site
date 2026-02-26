/**
 * Client-side CSRF token helper.
 * Reads the CSRF token from the cookie and provides it for fetch requests.
 *
 * Usage:
 *   import { getCsrfToken, csrfHeaders } from '@/lib/csrf-client'
 *
 *   // Option 1: Get token
 *   fetch('/api/...', { headers: { 'x-csrf-token': getCsrfToken() } })
 *
 *   // Option 2: Spread headers
 *   fetch('/api/...', { headers: { 'Content-Type': 'application/json', ...csrfHeaders() } })
 */

export function getCsrfToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/)
  return match ? match[1] : ''
}

export function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken()
  return token ? { 'x-csrf-token': token } : {}
}
