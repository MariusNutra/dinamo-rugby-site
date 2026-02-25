import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

export async function DELETE(req: NextRequest, { params }: { params: { childId: string; id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const photo = await prisma.childPhoto.findFirst({
    where: { id: params.id, childId: params.childId },
  })

  if (!photo) {
    return NextResponse.json({ error: 'Fotografie negasita' }, { status: 404 })
  }

  // Delete file from disk
  try {
    const filePath = path.join(process.cwd(), 'uploads', path.basename(photo.url))
    await fs.unlink(filePath)
  } catch {
    // File may already be deleted
  }

  await prisma.childPhoto.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
