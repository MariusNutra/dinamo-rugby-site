import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { audit } from '@/lib/audit'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params
  const userId = parseInt(id, 10)

  const body = await req.json()
  const { name, email, role, active, password } = body

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) {
    return NextResponse.json({ error: 'Utilizatorul nu a fost găsit' }, { status: 404 })
  }

  // Prevent deactivating yourself
  if (authUser.userId === userId && active === false) {
    return NextResponse.json({ error: 'Nu te poți dezactiva pe tine' }, { status: 400 })
  }

  // Prevent removing admin role from yourself
  if (authUser.userId === userId && role && role !== 'admin') {
    return NextResponse.json({ error: 'Nu îți poți schimba propriul rol' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (email !== undefined) updateData.email = email || null
  if (role !== undefined) updateData.role = role
  if (active !== undefined) updateData.active = active

  if (password) {
    if (password.length < 6) {
      return NextResponse.json({ error: 'Parola trebuie să aibă minim 6 caractere' }, { status: 400 })
    }
    updateData.password = await bcrypt.hash(password, 12)
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
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

  await audit({ action: 'update', entity: 'user', entityId: String(userId) })
  return NextResponse.json(user)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params
  const userId = parseInt(id, 10)

  // Prevent deleting yourself
  if (authUser.userId === userId) {
    return NextResponse.json({ error: 'Nu te poți șterge pe tine' }, { status: 400 })
  }

  await prisma.user.delete({ where: { id: userId } })

  await audit({ action: 'delete', entity: 'user', entityId: String(userId) })
  return NextResponse.json({ success: true })
}
