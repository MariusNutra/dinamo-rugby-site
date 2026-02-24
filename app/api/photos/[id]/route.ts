import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const id = parseInt(params.id)
  const photo = await prisma.photo.findUnique({ where: { id } })
  if (photo) {
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
    try { await fs.unlink(path.join(uploadDir, photo.filename)) } catch {}
    await prisma.photo.delete({ where: { id } })
  }
  return NextResponse.json({ success: true })
}
