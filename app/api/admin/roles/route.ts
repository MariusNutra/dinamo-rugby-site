import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const roles = await prisma.role.findMany({
    include: {
      _count: {
        select: { users: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const result = roles.map(role => ({
    id: role.id,
    name: role.name,
    label: role.label,
    permissions: (() => {
      try {
        const parsed = JSON.parse(role.permissions)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    })(),
    isSystem: role.isSystem,
    userCount: role._count.users,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const body = await req.json()
  const { name, label, permissions } = body

  if (!name || !label) {
    return NextResponse.json(
      { error: 'Numele și eticheta sunt obligatorii' },
      { status: 400 }
    )
  }

  // Validate name format (alphanumeric + hyphens, lowercase)
  const cleanName = name.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (cleanName !== name) {
    return NextResponse.json(
      { error: 'Numele poate conține doar litere mici, cifre și cratimă' },
      { status: 400 }
    )
  }

  // Check if name already exists
  const existing = await prisma.role.findUnique({ where: { name } })
  if (existing) {
    return NextResponse.json(
      { error: 'Un rol cu acest nume există deja' },
      { status: 400 }
    )
  }

  const permArray = Array.isArray(permissions) ? permissions : []

  const role = await prisma.role.create({
    data: {
      name,
      label,
      permissions: JSON.stringify(permArray),
      isSystem: false,
    },
  })

  return NextResponse.json({
    id: role.id,
    name: role.name,
    label: role.label,
    permissions: permArray,
    isSystem: role.isSystem,
    userCount: 0,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  })
}
