import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPhotographerId } from '@/lib/photographer-auth'
import { deleteVideoFiles } from '@/lib/media-upload'
import { parseMediaId, toMediaItem, type ParsedMediaId } from '@/lib/media-item'

const MAX_TITLE = 200
const MAX_DESCRIPTION = 1000

function trimmed(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const clean = value.trim().slice(0, max)
  return clean || null
}

const notFound = () => NextResponse.json({ error: 'Nu am gasit fisierul' }, { status: 404 })

/**
 * Rezolva cererea la un fisier care chiar ii apartine fotografului logat.
 *
 * Proprietarul intra in `where`, nu intr-un `if` de dupa citire: asa un id
 * ghicit nu poate atinge fisierul altcuiva, indiferent ce ramuri se adauga
 * mai tarziu. Fisierul strain si cel inexistent primesc acelasi 404 —
 * altfel raspunsul ar spune ce id-uri exista.
 */
async function resolveOwned(
  rawId: string
): Promise<{ photographerId: number; target: NonNullable<ParsedMediaId> } | NextResponse> {
  const photographerId = await getPhotographerId()
  if (photographerId === null) {
    return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
  }

  const target = parseMediaId(rawId)
  if (!target) {
    return NextResponse.json({ error: 'Identificator invalid' }, { status: 400 })
  }

  const owned =
    target.kind === 'photo'
      ? await prisma.photo.findFirst({
          where: { id: target.id, uploadedBy: photographerId },
          select: { id: true },
        })
      : await prisma.videoClip.findFirst({
          where: { id: target.id, uploadedBy: photographerId },
          select: { id: true },
        })

  if (!owned) return notFound()

  return { photographerId, target }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params
  const resolved = await resolveOwned(id)
  if (resolved instanceof NextResponse) return resolved
  const { target } = resolved

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  // Doar campurile trimise explicit se modifica; restul raman neatinse.
  const title = 'title' in body ? trimmed(body.title, MAX_TITLE) : undefined
  const description =
    'description' in body ? trimmed(body.description, MAX_DESCRIPTION) : undefined
  const grupa = 'grupa' in body ? trimmed(body.grupa, 20) : undefined
  const published = typeof body.published === 'boolean' ? body.published : undefined

  if (target.kind === 'photo') {
    const photo = await prisma.photo.update({
      where: { id: target.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { caption: description }),
        ...(grupa !== undefined && { grupa }),
        ...(published !== undefined && { published }),
      },
    })
    return NextResponse.json(toMediaItem.photo(photo))
  }

  // Filmuletul are titlul obligatoriu — daca vine gol, il lasam pe cel vechi.
  const clip = await prisma.videoClip.update({
    where: { id: target.id },
    data: {
      ...(title ? { title } : {}),
      ...(description !== undefined && { description }),
      ...(grupa !== undefined && { grupa }),
      ...(published !== undefined && { published }),
    },
  })
  return NextResponse.json(toMediaItem.clip(clip))
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params
  const resolved = await resolveOwned(id)
  if (resolved instanceof NextResponse) return resolved
  const { target } = resolved

  if (target.kind === 'photo') {
    await prisma.photo.delete({ where: { id: target.id } })
    return NextResponse.json({ success: true })
  }

  const clip = await prisma.videoClip.delete({ where: { id: target.id } })
  // Filmele ocupa spatiu real, spre deosebire de poze — le stergem si de pe disc.
  await deleteVideoFiles([clip.path, clip.posterPath])
  return NextResponse.json({ success: true })
}
