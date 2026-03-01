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

  let email: string, password: string, requestedRole: string | undefined
  try {
    const body = await req.json()
    email = body.email
    password = body.password
    requestedRole = body.role
  } catch {
    return NextResponse.json(
      { error: 'Date invalide.' },
      { status: 400 }
    )
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email-ul și parola sunt obligatorii.' },
      { status: 400 }
    )
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Try Parent first
  const parent = await prisma.parent.findUnique({
    where: { email: normalizedEmail },
    include: {
      children: {
        include: { team: true },
      },
    },
  })

  if (parent?.password) {
    const validPassword = await bcrypt.compare(password, parent.password)
    if (validPassword) {
      // If requested role is 'athlete' and parent has children, return athlete role
      const isAthlete = requestedRole === 'athlete' && parent.children.length > 0
      const role = isAthlete ? 'athlete' : 'parent'

      const token = jwt.sign(
        { parentId: parent.id, email: parent.email, role },
        getJwtSecret(),
        { expiresIn: '30d' }
      )

      return NextResponse.json({
        token,
        user: {
          id: parent.id,
          name: isAthlete ? parent.children[0].name : parent.name,
          email: parent.email,
          phone: parent.phone,
          role: role as 'parent' | 'athlete',
          children: parent.children.map((c) => ({
            id: c.id,
            name: c.name,
            birthYear: c.birthYear,
            teamId: c.teamId ? String(c.teamId) : '',
            teamName: c.team?.grupa || '',
          })),
        },
      })
    }
  }

  // Try Coach
  const coach = await prisma.coach.findFirst({
    where: { email: normalizedEmail },
    include: { team: true },
  })

  if (coach?.password) {
    const validPassword = await bcrypt.compare(password, coach.password)
    if (validPassword) {
      const token = jwt.sign(
        { coachId: coach.id, email: coach.email, role: 'coach' },
        getJwtSecret(),
        { expiresIn: '30d' }
      )

      return NextResponse.json({
        token,
        user: {
          id: coach.id,
          name: coach.name,
          email: coach.email,
          phone: coach.phone,
          role: 'coach' as const,
          teamId: String(coach.teamId),
          teamName: coach.team?.grupa || '',
        },
      })
    }
  }

  return NextResponse.json(
    { error: 'Email sau parolă incorectă.' },
    { status: 401 }
  )
}
