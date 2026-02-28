import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'
import path from 'path'
import fs from 'fs'
import { v4 as uuid } from 'uuid'

const DOCS_DIR = path.join(process.cwd(), 'uploads', 'documents')

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const documents = await prisma.document.findMany({
    orderBy: { createdAt: 'desc' },
    include: { team: { select: { grupa: true } } },
  })

  return NextResponse.json(documents)
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const title = formData.get('title') as string
  const category = (formData.get('category') as string) || 'general'
  const targetGroup = (formData.get('targetGroup') as string) || 'all'
  const teamId = formData.get('teamId') as string | null

  if (!file || !title) {
    return NextResponse.json({ error: 'Titlu și fișier sunt obligatorii' }, { status: 400 })
  }

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
  ]

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Tip de fișier neacceptat. Acceptăm: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG' }, { status: 400 })
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fișierul nu poate depăși 20MB' }, { status: 400 })
  }

  // Ensure upload directory exists
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true })
  }

  const ext = path.extname(file.name) || '.pdf'
  const filename = `${uuid()}${ext}`
  const filePath = path.join(DOCS_DIR, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(filePath, buffer)

  const doc = await prisma.document.create({
    data: {
      title,
      category,
      filePath: `/uploads/documents/${filename}`,
      fileSize: file.size,
      mimeType: file.type,
      targetGroup,
      teamId: teamId ? parseInt(teamId, 10) : null,
      uploadedBy: 'admin',
    },
    include: { team: { select: { grupa: true } } },
  })

  return NextResponse.json(doc)
}
