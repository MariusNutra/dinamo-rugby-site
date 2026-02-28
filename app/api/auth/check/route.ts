import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { isAuthenticated } from '@/lib/auth'
import { setCsrfCookie } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is required')
  return secret
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(req: NextRequest) {
  // Check for Bearer token (mobile app)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as {
        parentId: string
        email: string
        role: string
      }

      const parent = await prisma.parent.findUnique({
        where: { id: decoded.parentId },
        include: {
          children: {
            include: { team: true },
          },
        },
      })

      if (!parent) {
        return NextResponse.json({ authenticated: false })
      }

      return NextResponse.json({
        authenticated: true,
        user: {
          id: parent.id,
          name: parent.name,
          email: parent.email,
          phone: parent.phone,
          role: 'parent',
          children: parent.children.map((c) => ({
            id: c.id,
            name: c.name,
            birthYear: c.birthYear,
            teamId: c.teamId ? String(c.teamId) : '',
            teamName: c.team?.grupa || '',
          })),
        },
      })
    } catch {
      return NextResponse.json({ authenticated: false })
    }
  }

  // Fallback: admin cookie auth (website)
  const auth = await isAuthenticated()
  const response = NextResponse.json({ authenticated: auth })
  if (auth) {
    return setCsrfCookie(response)
  }
  return response
}
