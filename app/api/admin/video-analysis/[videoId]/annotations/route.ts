import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, getAuthUser } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const videoId = Number(params.videoId)
  if (isNaN(videoId)) {
    return NextResponse.json({ error: 'ID video invalid' }, { status: 400 })
  }

  const annotations = await prisma.videoAnnotation.findMany({
    where: { videoId },
    orderBy: { timestamp: 'asc' },
  })

  return NextResponse.json(annotations)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const videoId = Number(params.videoId)
  if (isNaN(videoId)) {
    return NextResponse.json({ error: 'ID video invalid' }, { status: 400 })
  }

  // Verify video exists
  const video = await prisma.video.findUnique({ where: { id: videoId } })
  if (!video) {
    return NextResponse.json({ error: 'Video negasit' }, { status: 404 })
  }

  const body = await req.json()
  const { timestamp, text } = body

  if (timestamp === undefined || timestamp === null || !text) {
    return NextResponse.json(
      { error: 'Timestamp si textul sunt obligatorii' },
      { status: 400 }
    )
  }

  const user = await getAuthUser()

  const annotation = await prisma.videoAnnotation.create({
    data: {
      videoId,
      timestamp: Number(timestamp),
      text: String(text).slice(0, 2000),
      author: user?.username || null,
    },
  })

  return NextResponse.json(annotation, { status: 201 })
}
