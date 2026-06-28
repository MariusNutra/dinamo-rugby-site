import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'
import fs from 'fs/promises'
import path from 'path'

export async function DELETE(req: NextRequest, { params }: { params: { childId: string; id: string } }) {
  const authz = await requirePermission('athletes.manage')
  if (authz.error) return authz.error

  const photo = await prisma.childPhoto.findFirst({
    where: { id: params.id, childId: params.childId },
  })

  if (!photo) {
    return NextResponse.json({ error: 'Fotografie negasita' }, { status: 404 })
  }

  // Delete file from disk
  try {
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
    // photo.url is like /uploads/gallery/timestamp-name.jpg — strip /uploads/ prefix
    const relativePath = photo.url.replace(/^\/uploads\//, '')
    await fs.unlink(path.join(uploadDir, relativePath))
  } catch {
    // File may already be deleted
  }

  await prisma.childPhoto.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
