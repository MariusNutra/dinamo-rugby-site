import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is required')
  return secret
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

/**
 * POST /api/auth/set-password
 *
 * Sets a password for a parent account. Can be called with either:
 * - A valid magic link token (for first-time setup)
 * - A valid Bearer JWT (for changing password from the app)
 */
export async function POST(req: NextRequest) {
  const { password, token: magicToken } = await req.json()

  if (!password || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json(
      { error: 'Parola trebuie să aibă minim 6 caractere.' },
      { status: 400 }
    )
  }

  let parentId: string | null = null

  // Auth via Bearer token (logged-in user changing password)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), getJwtSecret()) as {
        parentId: string
      }
      parentId = decoded.parentId
    } catch {
      return NextResponse.json({ error: 'Token invalid.' }, { status: 401 })
    }
  }

  // Auth via magic link token (first-time setup)
  if (!parentId && magicToken) {
    const parent = await prisma.parent.findFirst({
      where: {
        token: magicToken,
        tokenExpiry: { gte: new Date() },
      },
    })
    if (parent) {
      parentId = parent.id
    }
  }

  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat.' }, { status: 401 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.parent.update({
    where: { id: parentId },
    data: {
      password: hashedPassword,
      token: null,
      tokenExpiry: null,
    },
  })

  return NextResponse.json({ success: true })
}
