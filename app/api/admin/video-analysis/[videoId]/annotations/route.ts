import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { requirePermission } from '@/lib/authz'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, props: { params: Promise<{ videoId: string }> }) {
  const params = await props.params;
  const authz = await requirePermission('matches.view')
  if (authz.error) return authz.error

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

export async function POST(req: NextRequest, props: { params: Promise<{ videoId: string }> }) {
  const params = await props.params;
  const authz = await requirePermission('matches.manage')
  if (authz.error) return authz.error
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
