import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/authz'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // Admin-only
  const authz = await requireAdmin()
  if (authz.error) return authz.error

  const ip = getClientIp(req)
  const limit = await checkRateLimit(ip, {
    action: 'register',
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
  })

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Prea multe cereri. Reîncearcă mai târziu.' },
      { status: 429 }
    )
  }

  let body: { email?: string; name?: string; password?: string; role?: string; teamId?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { email, name, password, role, teamId } = body

  if (!email || !name || !password || !role) {
    return NextResponse.json(
      { error: 'Email, nume, parolă și rol sunt obligatorii.' },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Parola trebuie să aibă cel puțin 6 caractere.' },
      { status: 400 }
    )
  }

  const normalizedEmail = email.toLowerCase().trim()
  const hashedPassword = await bcrypt.hash(password, 12)

  try {
    if (role === 'admin' || role === 'superadmin' || role === 'editor' || role === 'manager') {
      // Check if username already exists (use email prefix as username)
      const username = normalizedEmail.split('@')[0]
      const existingUser = await prisma.user.findUnique({ where: { username } })
      if (existingUser) {
        return NextResponse.json({ error: 'Un utilizator cu acest username există deja.' }, { status: 409 })
      }

      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          name,
          email: normalizedEmail,
          role,
          active: true,
        },
      })

      return NextResponse.json({
        success: true,
        user: { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role },
      })
    }

    if (role === 'antrenor' || role === 'coach') {
      if (!teamId) {
        return NextResponse.json({ error: 'teamId este obligatoriu pentru antrenor.' }, { status: 400 })
      }

      const existingCoach = await prisma.coach.findFirst({ where: { email: normalizedEmail } })
      if (existingCoach) {
        return NextResponse.json({ error: 'Un antrenor cu acest email există deja.' }, { status: 409 })
      }

      const coach = await prisma.coach.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          teamId,
        },
      })

      return NextResponse.json({
        success: true,
        user: { id: coach.id, name: coach.name, email: coach.email, role: 'antrenor' },
      })
    }

    if (role === 'parinte' || role === 'parent') {
      const existingParent = await prisma.parent.findUnique({ where: { email: normalizedEmail } })
      if (existingParent) {
        return NextResponse.json({ error: 'Un părinte cu acest email există deja.' }, { status: 409 })
      }

      const parent = await prisma.parent.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
        },
      })

      return NextResponse.json({
        success: true,
        user: { id: parent.id, name: parent.name, email: parent.email, role: 'parinte' },
      })
    }

    // For 'sportiv'/'athlete' role, create a parent account (athletes log in via parent)
    if (role === 'sportiv' || role === 'athlete') {
      const existingParent = await prisma.parent.findUnique({ where: { email: normalizedEmail } })
      if (existingParent) {
        return NextResponse.json({ error: 'Un cont cu acest email există deja.' }, { status: 409 })
      }

      const parent = await prisma.parent.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
        },
      })

      return NextResponse.json({
        success: true,
        user: { id: parent.id, name: parent.name, email: parent.email, role: 'sportiv' },
      })
    }

    return NextResponse.json({ error: 'Rol invalid.' }, { status: 400 })
  } catch (error) {
    console.error('[register] Error:', error)
    return NextResponse.json({ error: 'Eroare la creare cont.' }, { status: 500 })
  }
}
