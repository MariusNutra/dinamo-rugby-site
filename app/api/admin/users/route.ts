import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { audit } from '@/lib/audit'

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const body = await req.json()
  const { username, password, name, email, role } = body

  if (!username || !password || !name) {
    return NextResponse.json({ error: 'Username, parolă și nume sunt obligatorii' }, { status: 400 })
  }

  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Parola trebuie sa aiba minim 8 caractere.' }, { status: 400 })
  }
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json({ error: 'Parola trebuie sa contina cel putin o litera mare si o cifra.' }, { status: 400 })
  }

  // Check unique username
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: 'Username-ul este deja folosit' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      username,
      password: hash,
      name,
      email: email || null,
      role: role || 'editor',
      active: true,
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  })

  await audit({ action: 'create', entity: 'user', entityId: String(user.id), details: user.username })
  return NextResponse.json(user)
}
