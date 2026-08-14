import fs from 'fs/promises'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { sanitizeFilename } from '@/lib/upload'

const execFileAsync = promisify(execFile)

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
const VIDEO_SUBFOLDER = 'video'

export const MAX_VIDEO_BYTES = 200 * 1024 * 1024 // 200 MB
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024 // 25 MB

/**
 * Formatele acceptate. Cheia e extensia, valoarea e tipul MIME cu care va fi
 * servit fisierul. Lista e scurta intentionat: sunt formatele care merg nativ
 * in browser, fara reconversie. Ce nu e aici, nu se salveaza.
 */
const ALLOWED_VIDEO: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
}

export function isAllowedVideo(originalName: string): boolean {
  return path.extname(originalName).toLowerCase() in ALLOWED_VIDEO
}

export const ALLOWED_VIDEO_EXTENSIONS = Object.keys(ALLOWED_VIDEO)

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

/** Durata in secunde, sau null daca ffprobe nu o poate citi. */
async function readDuration(filePath: string): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync(
      'ffprobe',
      [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        filePath,
      ],
      { timeout: 30_000 }
    )
    const seconds = parseFloat(stdout.trim())
    return Number.isFinite(seconds) ? Math.round(seconds * 10) / 10 : null
  } catch {
    return null
  }
}

/**
 * Extrage un cadru ca imagine de coperta. Fara ea, lista de filmulete ar fi
 * un sir de dreptunghiuri negre — browserul nu deseneaza primul cadru decat
 * dupa ce incepe sa descarce filmul.
 */
async function extractPoster(
  filePath: string,
  targetDir: string,
  baseName: string,
  durationSec: number | null
): Promise<string | null> {
  // Un cadru de la o secunda e aproape mereu mai bun decat cel de la zero
  // (multe clipuri incep cu un cadru negru), dar nu si la clipurile foarte scurte.
  const seekTo = durationSec !== null && durationSec < 2 ? 0 : 1
  const posterName = `${baseName}-poster.jpg`
  const posterPath = path.join(targetDir, posterName)

  try {
    await execFileAsync(
      'ffmpeg',
      [
        '-ss', String(seekTo),
        '-i', filePath,
        '-frames:v', '1',
        '-vf', 'scale=1280:-2',
        '-q:v', '4',
        '-y',
        posterPath,
      ],
      { timeout: 60_000 }
    )
    await fs.access(posterPath)
    return `/uploads/${VIDEO_SUBFOLDER}/${posterName}`
  } catch {
    return null
  }
}

export interface SavedVideo {
  filename: string
  path: string
  posterPath: string | null
  mimeType: string
  sizeBytes: number
  durationSec: number | null
}

/**
 * Salveaza un filmulet pe disc si ii citeste durata + coperta.
 * Numele fisierului e generat de noi, niciodata preluat de la client.
 */
export async function saveVideo(
  buffer: Buffer,
  originalName: string
): Promise<SavedVideo> {
  const ext = path.extname(originalName).toLowerCase()
  const mimeType = ALLOWED_VIDEO[ext]
  if (!mimeType) {
    throw new Error(`Format neacceptat: ${ext || 'fara extensie'}`)
  }

  const targetDir = path.join(UPLOAD_DIR, VIDEO_SUBFOLDER)
  await ensureDir(targetDir)

  const baseName = `${Date.now()}-${sanitizeFilename(originalName)}`
  const filename = `${baseName}${ext}`
  const filePath = path.join(targetDir, filename)

  await fs.writeFile(filePath, buffer)

  const durationSec = await readDuration(filePath)
  const posterPath = await extractPoster(filePath, targetDir, baseName, durationSec)

  return {
    filename: `${VIDEO_SUBFOLDER}/${filename}`,
    path: `/uploads/${VIDEO_SUBFOLDER}/${filename}`,
    posterPath,
    mimeType,
    sizeBytes: buffer.length,
    durationSec,
  }
}

/**
 * Sterge de pe disc fisierele unui filmulet. Nu arunca daca lipsesc:
 * stergerea din baza e ce conteaza, un fisier ramas orfan nu strica nimic.
 */
export async function deleteVideoFiles(relativePaths: (string | null)[]): Promise<void> {
  for (const relative of relativePaths) {
    if (!relative) continue
    const withoutPrefix = relative.replace(/^\/uploads\//, '')
    const filePath = path.join(UPLOAD_DIR, withoutPrefix)
    // Plasa de siguranta: nu stergem nimic din afara directorului de incarcari.
    if (!path.resolve(filePath).startsWith(path.resolve(UPLOAD_DIR))) continue
    await fs.unlink(filePath).catch(() => {})
  }
}
