import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'
import fs from 'fs/promises'
import path from 'path'

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const authz = await requirePermission('gallery.manage')
  if (authz.error) return authz.error
  const id = parseInt(params.id)
  const data = await req.json()
  const photo = await prisma.photo.update({
    where: { id },
    data: { storyId: data.storyId ?? undefined },
  })
  return NextResponse.json(photo)
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const authz = await requirePermission('gallery.manage')
  if (authz.error) return authz.error
  const id = parseInt(params.id)
  const photo = await prisma.photo.findUnique({ where: { id } })
  if (photo) {
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
    try { await fs.unlink(path.join(uploadDir, photo.filename)) } catch {}
    await prisma.photo.delete({ where: { id } })
  }
  return NextResponse.json({ success: true })
}
