import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is required')
  return secret
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  const limit = await checkRateLimit(ip, {
    action: 'app_login',
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
  })

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Prea multe încercări. Reîncearcă mai târziu.' },
      { status: 429 }
    )
  }

  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email-ul și parola sunt obligatorii.' },
      { status: 400 }
    )
  }

  const normalizedEmail = email.toLowerCase().trim()

  const parent = await prisma.parent.findUnique({
    where: { email: normalizedEmail },
    include: {
      children: {
        include: { team: true },
      },
    },
  })

  if (!parent || !parent.password) {
    return NextResponse.json(
      { error: 'Email sau parolă incorectă.' },
      { status: 401 }
    )
  }

  const validPassword = await bcrypt.compare(password, parent.password)
  if (!validPassword) {
    return NextResponse.json(
      { error: 'Email sau parolă incorectă.' },
      { status: 401 }
    )
  }

  const token = jwt.sign(
    { parentId: parent.id, email: parent.email, role: 'parent' },
    getJwtSecret(),
    { expiresIn: '30d' }
  )

  const user = {
    id: parent.id,
    name: parent.name,
    email: parent.email,
    phone: parent.phone,
    role: 'parent' as const,
    children: parent.children.map((c) => ({
      id: c.id,
      name: c.name,
      birthYear: c.birthYear,
      teamId: c.teamId ? String(c.teamId) : '',
      teamName: c.team?.grupa || '',
    })),
  }

  return NextResponse.json({ token, user })
}
