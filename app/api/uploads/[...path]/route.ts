import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
  const filePath = path.join(uploadDir, ...params.path)

  if (!filePath.startsWith(uploadDir)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const file = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'application/octet-stream'
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
