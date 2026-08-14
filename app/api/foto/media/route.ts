import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getPhotographerId } from '@/lib/photographer-auth'
import { saveImage } from '@/lib/upload'
import {
  saveVideo,
  isAllowedVideo,
  MAX_PHOTO_BYTES,
  MAX_VIDEO_BYTES,
} from '@/lib/media-upload'
import { toMediaItem, type MediaItem } from '@/lib/media-item'

const ALLOWED_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']
const MAX_FILES_PER_REQUEST = 20

function isAllowedPhoto(name: string): boolean {
  return ALLOWED_PHOTO_EXTENSIONS.includes(path.extname(name).toLowerCase())
}

function humanMb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`
}

export async function GET() {
  const photographerId = await getPhotographerId()
  if (photographerId === null) {
    return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
  }

  // Fiecare fotograf vede doar ce a incarcat el. Pozele puse din admin au
  // `uploadedBy` gol si raman in seama adminului — portalul nu le atinge.
  // Pozele legate de o poveste se gestioneaza din ecranul povestii, nu de aici.
  const [photos, clips] = await Promise.all([
    prisma.photo.findMany({
      where: { storyId: null, uploadedBy: photographerId },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
    prisma.videoClip.findMany({
      where: { uploadedBy: photographerId },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
  ])

  const items: MediaItem[] = [
    ...photos.map(toMediaItem.photo),
    ...clips.map(toMediaItem.clip),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const photographerId = await getPhotographerId()
  if (photographerId === null) {
    return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Nu am putut citi fisierele.' }, { status: 400 })
  }

  const files = formData.getAll('files').filter((f): f is File => f instanceof File)
  if (files.length === 0) {
    return NextResponse.json({ error: 'Niciun fisier trimis.' }, { status: 400 })
  }
  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Maxim ${MAX_FILES_PER_REQUEST} fisiere odata.` },
      { status: 400 }
    )
  }

  const grupa = (formData.get('grupa') as string | null)?.trim() || null
  const title = (formData.get('title') as string | null)?.trim() || null
  const description = (formData.get('description') as string | null)?.trim() || null
  // Portalul trimite mereu valoarea, explicit. Daca lipseste — o cerere venita
  // din alta parte — ramane ciorna: nimic nu ajunge pe sit din greseala.
  const published = formData.get('published') === 'true'

  const saved: MediaItem[] = []
  const rejected: { name: string; reason: string }[] = []

  for (const file of files) {
    const name = file.name || 'fisier'
    try {
      if (isAllowedVideo(name)) {
        if (file.size > MAX_VIDEO_BYTES) {
          rejected.push({ name, reason: `Depaseste ${humanMb(MAX_VIDEO_BYTES)}` })
          continue
        }
        const buffer = Buffer.from(await file.arrayBuffer())
        const video = await saveVideo(buffer, name)
        const clip = await prisma.videoClip.create({
          data: {
            title: title || path.basename(name, path.extname(name)),
            description,
            grupa,
            filename: video.filename,
            path: video.path,
            posterPath: video.posterPath,
            mimeType: video.mimeType,
            sizeBytes: video.sizeBytes,
            durationSec: video.durationSec,
            published,
            uploadedBy: photographerId,
          },
        })
        saved.push(toMediaItem.clip(clip))
        continue
      }

      if (isAllowedPhoto(name)) {
        if (file.size > MAX_PHOTO_BYTES) {
          rejected.push({ name, reason: `Depaseste ${humanMb(MAX_PHOTO_BYTES)}` })
          continue
        }
        const buffer = Buffer.from(await file.arrayBuffer())
        const image = await saveImage(buffer, name, 'gallery')
        const photo = await prisma.photo.create({
          data: {
            filename: image.filename,
            path: image.path,
            title,
            caption: description,
            grupa,
            published,
            uploadedBy: photographerId,
          },
        })
        saved.push(toMediaItem.photo(photo))
        continue
      }

      rejected.push({ name, reason: 'Format neacceptat' })
    } catch (err) {
      // Un fisier stricat nu trebuie sa anuleze intreaga incarcare.
      console.error(`[foto] esec la ${name}:`, err)
      rejected.push({ name, reason: 'Fisierul nu a putut fi procesat' })
    }
  }

  if (saved.length === 0) {
    return NextResponse.json(
      { error: 'Niciun fisier nu a putut fi incarcat.', rejected },
      { status: 400 }
    )
  }

  return NextResponse.json({ saved, rejected })
}
