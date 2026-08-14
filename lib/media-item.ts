import type { Photo, VideoClip } from '@prisma/client'

/**
 * Forma comuna sub care portalul de foto vede si pozele, si filmuletele.
 * Cele doua stau in tabele diferite (pozele au id numeric si istoric lung,
 * filmuletele sunt un model nou), asa ca id-ul e prefixat ca sa nu se
 * confunde intre ele la editare sau stergere.
 */
export interface MediaItem {
  id: string
  kind: 'photo' | 'video'
  title: string | null
  description: string | null
  grupa: string | null
  url: string
  posterUrl: string | null
  published: boolean
  durationSec: number | null
  createdAt: string
}

export const toMediaItem = {
  photo(photo: Photo): MediaItem {
    return {
      id: `photo:${photo.id}`,
      kind: 'photo',
      title: photo.title,
      description: photo.caption,
      grupa: photo.grupa,
      url: photo.path,
      posterUrl: photo.path,
      published: photo.published,
      durationSec: null,
      createdAt: photo.createdAt.toISOString(),
    }
  },

  clip(clip: VideoClip): MediaItem {
    return {
      id: `clip:${clip.id}`,
      kind: 'video',
      title: clip.title,
      description: clip.description,
      grupa: clip.grupa,
      url: clip.path,
      posterUrl: clip.posterPath,
      published: clip.published,
      durationSec: clip.durationSec,
      createdAt: clip.createdAt.toISOString(),
    }
  },
}

export type ParsedMediaId =
  | { kind: 'photo'; id: number }
  | { kind: 'clip'; id: string }
  | null

/** Desface `photo:12` / `clip:abc` inapoi in tabel + id. */
export function parseMediaId(raw: string): ParsedMediaId {
  const separator = raw.indexOf(':')
  if (separator === -1) return null

  const prefix = raw.slice(0, separator)
  const value = raw.slice(separator + 1)
  if (!value) return null

  if (prefix === 'photo') {
    const id = Number(value)
    return Number.isInteger(id) && id > 0 ? { kind: 'photo', id } : null
  }

  if (prefix === 'clip') {
    return { kind: 'clip', id: value }
  }

  return null
}
