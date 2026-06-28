import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authz'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const authz = await requirePermission('gallery.view')
  if (authz.error) return authz.error
  const videos = await prisma.video.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(videos)
}

export async function POST(req: NextRequest) {
  const authz = await requirePermission('gallery.manage')
  if (authz.error) return authz.error
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { title, youtubeUrl, description, grupa, featured } = body

  if (!title || !youtubeUrl) {
    return NextResponse.json({ error: 'Titlul si URL-ul YouTube sunt obligatorii' }, { status: 400 })
  }

  const video = await prisma.video.create({
    data: {
      title: String(title).slice(0, 200),
      youtubeUrl: String(youtubeUrl).slice(0, 500),
      description: description ? String(description).slice(0, 2000) : null,
      grupa: grupa || null,
      featured: featured === true,
    },
  })
  return NextResponse.json(video, { status: 201 })
}
