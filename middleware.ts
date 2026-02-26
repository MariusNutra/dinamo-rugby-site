import { NextRequest, NextResponse } from 'next/server'

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
const CACHE_TTL = 60_000 // 60 seconds

async function getModuleSettingsCached(req: NextRequest): Promise<Record<string, boolean> | null> {
  const now = Date.now()
  if (cachedSettings && now - cacheTime < CACHE_TTL) {
    return cachedSettings
  }

  try {
    const url = req.nextUrl.clone()
    url.pathname = '/api/modules/active'
    url.search = ''
    const res = await fetch(url.toString())
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

export async function middleware(req: NextRequest) {
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
    '/admin/sportivi',
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
    '/inscrieri/:path*',
    '/calendar/:path*',
    '/statistici/:path*',
    '/magazin/:path*',
    '/video-highlights/:path*',
    '/sponsori/:path*',
  ],
}
