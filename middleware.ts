import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // Intercept GET /api/parinti/verify?token=xxx
  // Old flow: browser follows magic link -> GET /api/parinti/verify -> redirect with cookie
  // New flow: redirect to /parinti/verify page which POSTs the token
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

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/parinti/verify', '/admin/sportivi'],
}
