import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function saveImage(buffer: Buffer, originalName: string): Promise<{ filename: string; path: string }> {
  await ensureUploadDir()

  const ext = '.jpg'
  const filename = `${uuidv4()}${ext}`
  const filePath = path.join(UPLOAD_DIR, filename)

  await sharp(buffer)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(filePath)

  return { filename, path: `/uploads/${filename}` }
}
