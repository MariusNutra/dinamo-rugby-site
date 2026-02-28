import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params

  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) {
    return NextResponse.json({ error: 'Document negăsit' }, { status: 404 })
  }

  // Delete file from disk
  const fullPath = path.join(process.cwd(), doc.filePath)
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath)
  }

  await prisma.document.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { title, category, targetGroup, teamId } = body

  const doc = await prisma.document.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(category !== undefined && { category }),
      ...(targetGroup !== undefined && { targetGroup }),
      ...(teamId !== undefined && { teamId: teamId ? parseInt(teamId, 10) : null }),
    },
    include: { team: { select: { grupa: true } } },
  })

  return NextResponse.json(doc)
}
