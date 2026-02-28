import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params
  const roleId = parseInt(id)
  if (isNaN(roleId)) {
    return NextResponse.json({ error: 'ID invalid' }, { status: 400 })
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } })
  if (!role) {
    return NextResponse.json({ error: 'Rolul nu a fost găsit' }, { status: 404 })
  }

  const body = await req.json()
  const { label, permissions } = body

  const updateData: Record<string, unknown> = {}

  if (label !== undefined) {
    if (!label.trim()) {
      return NextResponse.json(
        { error: 'Eticheta nu poate fi goală' },
        { status: 400 }
      )
    }
    updateData.label = label.trim()
  }

  if (permissions !== undefined) {
    const permArray = Array.isArray(permissions) ? permissions : []
    updateData.permissions = JSON.stringify(permArray)
  }

  const updated = await prisma.role.update({
    where: { id: roleId },
    data: updateData,
    include: {
      _count: {
        select: { users: true },
      },
    },
  })

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    label: updated.label,
    permissions: (() => {
      try {
        const parsed = JSON.parse(updated.permissions)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    })(),
    isSystem: updated.isSystem,
    userCount: updated._count.users,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params
  const roleId = parseInt(id)
  if (isNaN(roleId)) {
    return NextResponse.json({ error: 'ID invalid' }, { status: 400 })
  }

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      _count: {
        select: { users: true },
      },
    },
  })

  if (!role) {
    return NextResponse.json({ error: 'Rolul nu a fost găsit' }, { status: 404 })
  }

  if (role.isSystem) {
    return NextResponse.json(
      { error: 'Nu poți șterge un rol de sistem' },
      { status: 400 }
    )
  }

  if (role._count.users > 0) {
    return NextResponse.json(
      { error: `Nu poți șterge acest rol — are ${role._count.users} utilizator(i) asociat(i)` },
      { status: 400 }
    )
  }

  await prisma.role.delete({ where: { id: roleId } })

  return NextResponse.json({ success: true })
}
