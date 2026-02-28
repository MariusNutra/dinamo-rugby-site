import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { title, youtubeUrl, description, grupa, featured } = body

  const video = await prisma.video.update({
    where: { id: Number(params.id) },
    data: {
      ...(title !== undefined && { title: String(title).slice(0, 200) }),
      ...(youtubeUrl !== undefined && { youtubeUrl: String(youtubeUrl).slice(0, 500) }),
      ...(description !== undefined && { description: description ? String(description).slice(0, 2000) : null }),
      ...(grupa !== undefined && { grupa }),
      ...(featured !== undefined && { featured: featured === true }),
    },
  })
  return NextResponse.json(video)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  await prisma.video.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ success: true })
}
