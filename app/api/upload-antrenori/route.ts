import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const coaches = [
  'hildan-cristian',
  'curea-darie',
  'andrei-guranescu',
  'stefan-demici',
]

export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const outputDir = path.join(process.cwd(), 'public', 'images', 'antrenori')
    await fs.mkdir(outputDir, { recursive: true })

    const uploaded: string[] = []

    for (const key of coaches) {
      const file = formData.get(key) as File | null
      if (!file) continue
      if (file.size > MAX_FILE_SIZE) continue

      const buffer = Buffer.from(await file.arrayBuffer())

      // Save as 400x400 WebP for the coaches page
      await sharp(buffer)
        .resize(400, 400, { fit: 'cover', position: 'top' })
        .webp({ quality: 85 })
        .toFile(path.join(outputDir, `${key}.webp`))

      uploaded.push(`${key}.webp`)
    }

    if (uploaded.length === 0) {
      return NextResponse.json({ error: 'Nu a fost selectata nicio poza.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, uploaded })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Eroare la procesarea pozelor.' }, { status: 500 })
  }
}
