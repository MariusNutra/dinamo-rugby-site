import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const coachId = formData.get('coachId') as string | null

    if (!file || !coachId) {
      return NextResponse.json({ error: 'Lipsesc file sau coachId.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fisierul depaseste 5MB.' }, { status: 400 })
    }

    // Verify coach exists
    const coach = await prisma.coach.findUnique({ where: { id: coachId } })
    if (!coach) {
      return NextResponse.json({ error: 'Antrenorul nu exista.' }, { status: 404 })
    }

    const outputDir = path.join(process.cwd(), 'public', 'images', 'antrenori')
    await fs.mkdir(outputDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${coachId}.webp`

    await sharp(buffer)
      .resize(400, 400, { fit: 'cover', position: 'top' })
      .webp({ quality: 85 })
      .toFile(path.join(outputDir, filename))

    const url = `/images/antrenori/${filename}`

    await prisma.coach.update({
      where: { id: coachId },
      data: { photo: url },
    })

    return NextResponse.json({ success: true, url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Eroare la procesarea pozei.' }, { status: 500 })
  }
}
