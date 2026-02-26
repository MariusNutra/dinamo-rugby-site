import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { saveImage } from '@/lib/upload'

const ALLOWED_FOLDERS = ['fundraising', 'products', 'sponsors', 'gallery', 'stories']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = formData.get('folder') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Fisierul este obligatoriu' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Doar fisiere imagine sunt acceptate' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fisierul depaseste limita de 5MB' }, { status: 400 })
    }

    if (folder && !ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: 'Folder invalid' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await saveImage(buffer, file.name, folder || undefined)

    return NextResponse.json({ url: result.path })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Eroare la upload' }, { status: 500 })
  }
}
