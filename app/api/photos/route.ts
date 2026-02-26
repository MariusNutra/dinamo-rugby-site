import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { saveImage } from '@/lib/upload'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const grupa = searchParams.get('grupa')
  const limit = parseInt(searchParams.get('limit') || '50')

  const photos = await prisma.photo.findMany({
    where: grupa ? { grupa } : {},
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json(photos)
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  const grupa = formData.get('grupa') as string | null
  const caption = formData.get('caption') as string | null
  const albumName = formData.get('albumName') as string | null
  const storyId = formData.get('storyId') as string | null

  // Determine subfolder: stories if storyId present, otherwise gallery
  const subfolder = storyId ? 'stories' : 'gallery'

  const photos = []

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const { filename, path } = await saveImage(buffer, file.name, subfolder)

    const photo = await prisma.photo.create({
      data: {
        filename,
        path,
        caption,
        grupa: grupa || null,
        albumName,
        storyId: storyId ? parseInt(storyId) : null,
      },
    })
    photos.push(photo)
  }

  return NextResponse.json(photos)
}
