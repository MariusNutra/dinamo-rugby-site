import { NextRequest, NextResponse } from 'next/server'
import { revokeRefreshToken } from '@/lib/unified-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(req: NextRequest) {
  // Try to revoke refresh token if provided
  try {
    const body = await req.json()
    if (body.refreshToken) {
      await revokeRefreshToken(body.refreshToken)
    }
  } catch {
    // Body may be empty for web logout, that's fine
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('admin_token')
  response.cookies.delete('parent_token')
  return response
}
