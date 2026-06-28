import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Module key → public route prefixes
const MODULE_ROUTE_MAP: Record<string, string[]> = {
  moduleEchipe: ['/echipe', '/antrenori'],
  moduleProgram: ['/program'],
  moduleMeciuri: ['/meciuri', '/rezultate'],
  moduleGalerie: ['/galerie'],
  modulePovesti: ['/povesti'],
  moduleContact: ['/contact'],
  moduleDespre: ['/despre'],
  modulePortalParinti: ['/parinti'],
  moduleFundraising: ['/fundraising'],
  moduleInscrieri: ['/inscrieri'],
  moduleCalendar: ['/calendar'],
  moduleStatistici: ['/statistici'],
  moduleMagazin: ['/magazin'],
  moduleVideoHighlights: ['/video-highlights'],
  moduleSponsori: ['/sponsori'],
}

let cachedSettings: Record<string, boolean> | null = null
let cacheTime = 0
const CACHE_TTL = 5_000 // 5 seconds

async function getModuleSettingsCached(req: NextRequest): Promise<Record<string, boolean> | null> {
  const now = Date.now()
  if (cachedSettings && now - cacheTime < CACHE_TTL) {
    return cachedSettings
  }

  try {
    const url = req.nextUrl.clone()
    url.pathname = '/api/modules/active'
    url.search = ''
    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (res.ok) {
      cachedSettings = await res.json()
      cacheTime = now
      return cachedSettings
    }
  } catch {
    // fail open
  }
  return null
}

const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// Edge-runtime JWT verification. lib/auth.ts uses `jsonwebtoken` (Node crypto),
// which is unavailable in middleware, so we verify the HS256 signature with jose
// using the same JWT_SECRET. Returns true only for a valid, unexpired token.
async function hasValidAdminToken(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_token')?.value
  const secret = process.env.JWT_SECRET
  if (!token || !secret) return false
  try {
    await jwtVerify(token, new TextEncoder().encode(secret))
    return true
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  // Server-side gate for the admin UI. The admin layout only checks auth
  // client-side (fetch /api/auth/check + redirect), so the admin shell was
  // served to anyone. Verify the admin JWT at the edge and bounce
  // unauthenticated users to the login page before any admin page renders.
  const adminPath = req.nextUrl.pathname
  if (
    (adminPath === '/admin' || adminPath.startsWith('/admin/')) &&
    adminPath !== '/admin/login'
  ) {
    if (!(await hasValidAdminToken(req))) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  // Central CSRF enforcement (double-submit cookie) for all admin mutations.
  // The client attaches the token automatically via CsrfFetchPatch; the cookie
  // is set on /api/auth/check. Done here so individual routes can't forget it.
  if (
    (req.nextUrl.pathname.startsWith('/api/admin/') ||
      req.nextUrl.pathname === '/api/admin-sportivi') &&
    !CSRF_SAFE_METHODS.has(req.method)
  ) {
    const cookieToken = req.cookies.get('csrf_token')?.value
    const headerToken = req.headers.get('x-csrf-token')
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return NextResponse.json(
        { error: 'Token CSRF lipsă sau invalid. Reîncarcă pagina și încearcă din nou.' },
        { status: 403 }
      )
    }
  }

  // Intercept GET /api/parinti/verify?token=xxx
  if (
    req.nextUrl.pathname === '/api/parinti/verify' &&
    req.method === 'GET' &&
    req.nextUrl.searchParams.has('token')
  ) {
    const token = req.nextUrl.searchParams.get('token')
    const url = req.nextUrl.clone()
    url.pathname = '/parinti-verify'
    url.search = `?token=${token}`
    return NextResponse.redirect(url)
  }

  // Rewrite /admin/sportivi to sportivi-manage (original page is read-only)
  if (req.nextUrl.pathname === '/admin/sportivi') {
    const url = req.nextUrl.clone()
    url.pathname = '/admin/sportivi-manage'
    return NextResponse.rewrite(url)
  }

  // Invalidate cache when admin updates settings
  if (req.nextUrl.pathname === '/api/admin/settings/modules' && req.method === 'PUT') {
    cachedSettings = null
    cacheTime = 0
    return NextResponse.next()
  }

  // Check if this is a public route that might be disabled
  const pathname = req.nextUrl.pathname
  for (const [moduleKey, routes] of Object.entries(MODULE_ROUTE_MAP)) {
    const matches = routes.some(route => pathname === route || pathname.startsWith(route + '/'))
    if (matches) {
      const settings = await getModuleSettingsCached(req)
      if (settings && settings[moduleKey] === false) {
        const url = req.nextUrl.clone()
        url.pathname = '/404'
        return NextResponse.rewrite(url)
      }
      break
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/parinti/verify',
    '/api/admin/:path*',
    '/api/admin-sportivi',
    '/admin',
    '/admin/:path*',
    '/echipe/:path*',
    '/antrenori/:path*',
    '/program/:path*',
    '/meciuri/:path*',
    '/rezultate/:path*',
    '/galerie/:path*',
    '/povesti/:path*',
    '/contact/:path*',
    '/despre/:path*',
    '/parinti/:path*',
    '/fundraising/:path*',
    '/inscrieri/:path+',
    '/calendar/:path*',
    '/statistici/:path*',
    '/magazin/:path*',
    '/video-highlights/:path*',
    '/sponsori/:path*',
  ],
}
