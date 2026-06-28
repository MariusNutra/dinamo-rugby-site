import { NextRequest, NextResponse } from 'next/server'
import { rotateRefreshToken } from '@/lib/unified-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(req: NextRequest) {
  let refreshToken: string
  try {
    const body = await req.json()
    refreshToken = body.refreshToken
  } catch {
    return NextResponse.json({ error: 'Date invalide.' }, { status: 400 })
  }

  if (!refreshToken) {
    return NextResponse.json({ error: 'refreshToken este obligatoriu.' }, { status: 400 })
  }

  const result = await rotateRefreshToken(refreshToken)

  if (!result) {
    return NextResponse.json({ error: 'Token invalid sau expirat.' }, { status: 401 })
  }

  return NextResponse.json({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  })
}
