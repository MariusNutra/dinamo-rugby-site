import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

function sanitizeFilename(name: string): string {
  // Remove extension, sanitize, then we'll add .jpg back
  const base = path.basename(name, path.extname(name))
  return base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-zA-Z0-9_-]/g, '-') // only safe chars
    .replace(/-+/g, '-')             // collapse dashes
    .replace(/^-|-$/g, '')           // trim dashes
    .toLowerCase()
    .slice(0, 80)                    // limit length
    || 'image'
}

function generateFilename(originalName: string): string {
  const timestamp = Date.now()
  const safeName = sanitizeFilename(originalName)
  return `${timestamp}-${safeName}.jpg`
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

export async function saveImage(
  buffer: Buffer,
  originalName: string,
  subfolder?: string
): Promise<{ filename: string; path: string }> {
  const targetDir = subfolder
    ? path.join(UPLOAD_DIR, subfolder)
    : UPLOAD_DIR
  await ensureDir(targetDir)

  const filename = generateFilename(originalName)
  const filePath = path.join(targetDir, filename)

  await sharp(buffer)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(filePath)

  const relativeName = subfolder ? `${subfolder}/${filename}` : filename
  return { filename: relativeName, path: `/uploads/${relativeName}` }
}
