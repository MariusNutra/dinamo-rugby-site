import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createParentToken } from '@/lib/parent-auth'

export async function POST(req: NextRequest) {
  const { token } = await req.json()

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token invalid.' }, { status: 400 })
  }

  const parent = await prisma.parent.findFirst({
    where: {
      token,
      tokenExpiry: { gt: new Date() },
    },
  })

  if (!parent) {
    return NextResponse.json({ error: 'Token invalid sau expirat.' }, { status: 401 })
  }

  // Clear token (single-use)
  await prisma.parent.update({
    where: { id: parent.id },
    data: { token: null, tokenExpiry: null },
  })

  const jwt = createParentToken(parent.id, parent.email)
  const response = NextResponse.json({ success: true, redirect: '/parinti/dashboard' })

  response.cookies.set('parent_token', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}

// Keep GET for backwards compatibility with already-sent magic links
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/parinti?error=invalid_token`)
  }

  // Redirect to the verify page which will POST the token
  return NextResponse.redirect(`${siteUrl}/parinti/verify?token=${token}`)
}
