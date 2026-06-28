'use client'

/**
 * Patches window.fetch (once, at module load) to attach the double-submit CSRF
 * token header to every same-origin state-changing request. This lets all admin
 * mutations be protected centrally (enforced server-side in middleware for
 * /api/admin/* ) without each call site having to remember the header.
 *
 * The token lives in the `csrf_token` cookie (httpOnly:false), set on
 * /api/auth/check. Patching at module scope — not in an effect — avoids the
 * child-effects-run-before-parent race so early page fetches are also covered.
 */

function patchFetch() {
  if (typeof window === 'undefined') return
  const w = window as unknown as { __csrfFetchPatched?: boolean }
  if (w.__csrfFetchPatched) return
  w.__csrfFetchPatched = true

  const originalFetch = window.fetch.bind(window)
  const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const method = (
        init?.method || (input instanceof Request ? input.method : 'GET')
      ).toUpperCase()

      const urlStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.toString()
          : input.url

      const sameOrigin =
        urlStr.startsWith('/') || urlStr.startsWith(window.location.origin)

      if (UNSAFE.has(method) && sameOrigin) {
        const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/)
        const token = m ? m[1] : ''
        if (token) {
          const headers = new Headers(
            init?.headers ||
              (input instanceof Request ? input.headers : undefined)
          )
          if (!headers.has('x-csrf-token')) headers.set('x-csrf-token', token)
          init = { ...init, headers }
        }
      }
    } catch {
      // Never let CSRF wiring break a request.
    }
    return originalFetch(input as RequestInfo | URL, init)
  }
}

patchFetch()

export default function CsrfFetchPatch() {
  return null
}
