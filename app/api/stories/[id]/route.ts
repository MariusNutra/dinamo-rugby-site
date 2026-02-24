import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  if (isNaN(id)) {
    const story = await prisma.story.findUnique({ where: { slug: params.id }, include: { photos: true } })
    if (!story) return NextResponse.json({ error: 'Nu a fost găsit' }, { status: 404 })
    return NextResponse.json(story)
  }
  const story = await prisma.story.findUnique({ where: { id }, include: { photos: true } })
  if (!story) return NextResponse.json({ error: 'Nu a fost găsit' }, { status: 404 })
  return NextResponse.json(story)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const id = parseInt(params.id)
  const data = await req.json()
  const story = await prisma.story.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      coverImage: data.coverImage,
      videoUrl: data.videoUrl,
      grupa: data.grupa,
      published: data.published,
    },
  })
  return NextResponse.json(story)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const id = parseInt(params.id)
  await prisma.story.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
