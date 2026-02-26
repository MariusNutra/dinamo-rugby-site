import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const videos = await prisma.video.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(videos)
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { title, youtubeUrl, description, grupa } = body

  if (!title || !youtubeUrl) {
    return NextResponse.json({ error: 'Titlul si URL-ul YouTube sunt obligatorii' }, { status: 400 })
  }

  const video = await prisma.video.create({
    data: {
      title: String(title).slice(0, 200),
      youtubeUrl: String(youtubeUrl).slice(0, 500),
      description: description ? String(description).slice(0, 2000) : null,
      grupa: grupa || null,
    },
  })
  return NextResponse.json(video, { status: 201 })
}
