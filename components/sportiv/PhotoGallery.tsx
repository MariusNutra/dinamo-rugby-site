'use client'

import { useState } from 'react'

interface Photo {
  id: string
  url: string
  caption: string | null
  event: string | null
  date: string | null
}

interface Props {
  photos: Photo[]
  consentRequired?: boolean
  consentUrl?: string
  onDelete?: (id: string) => void
}

export default function PhotoGallery({ photos, consentRequired, consentUrl, onDelete }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (consentRequired) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500 mb-3">Galeria foto nu este disponibila fara acord foto semnat.</p>
        {consentUrl && (
          <a href={consentUrl} className="inline-block bg-dinamo-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
            Semneaza acordul foto &rarr;
          </a>
        )}
      </div>
    )
  }

  if (photos.length === 0) return <p className="text-gray-400 text-sm text-center py-8">Nu exista fotografii.</p>

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {photos.map((photo, i) => (
          <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              src={photo.url}
              alt={photo.caption || 'Fotografie'}
              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setLightbox(i)}
            />
            {onDelete && (
              <button
                onClick={() => onDelete(photo.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                X
              </button>
            )}
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                {photo.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white text-2xl z-10">&times;</button>
          {lightbox > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1) }} className="absolute left-4 text-white text-3xl z-10">&larr;</button>
          )}
          {lightbox < photos.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1) }} className="absolute right-4 text-white text-3xl z-10">&rarr;</button>
          )}
          <img
            src={photos[lightbox].url}
            alt={photos[lightbox].caption || ''}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {photos[lightbox].caption && (
            <div className="absolute bottom-4 text-white text-sm text-center">{photos[lightbox].caption}</div>
          )}
        </div>
      )}
    </>
  )
}
