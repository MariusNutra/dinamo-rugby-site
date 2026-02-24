import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const grupa = searchParams.get('grupa')
  const limit = parseInt(searchParams.get('limit') || '50')

  const stories = await prisma.story.findMany({
    where: {
      published: true,
      ...(grupa ? { grupa } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { photos: true },
  })

  return NextResponse.json(stories)
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const data = await req.json()
  const slug = data.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const story = await prisma.story.create({
    data: {
      title: data.title,
      slug: slug + '-' + Date.now(),
      content: data.content,
      excerpt: data.excerpt || data.content.replace(/<[^>]*>/g, '').substring(0, 200),
      coverImage: data.coverImage || null,
      videoUrl: data.videoUrl || null,
      grupa: data.grupa || null,
      published: data.published !== false,
    },
  })

  return NextResponse.json(story)
}
