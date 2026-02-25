import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { saveImage } from '@/lib/upload'

export async function GET(req: NextRequest, { params }: { params: { childId: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const photos = await prisma.childPhoto.findMany({
    where: { childId: params.childId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(photos)
}

export async function POST(req: NextRequest, { params }: { params: { childId: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const child = await prisma.child.findUnique({ where: { id: params.childId } })
  if (!child) {
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  if (!child.photoConsent) {
    return NextResponse.json({ error: 'Copilul nu are acord foto semnat. Upload-ul nu este permis.' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const caption = formData.get('caption') as string | null
  const event = formData.get('event') as string | null

  if (!file) {
    return NextResponse.json({ error: 'Fisierul este obligatoriu' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { path } = await saveImage(buffer, file.name)

  const photo = await prisma.childPhoto.create({
    data: {
      childId: params.childId,
      url: path,
      caption,
      event,
      date: new Date(),
    },
  })

  return NextResponse.json(photo, { status: 201 })
}
