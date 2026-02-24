'use client'

import { useState } from 'react'

interface Photo {
  id: number
  path: string
  caption?: string | null
  grupa?: string | null
}

export default function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Încă nu sunt poze adăugate.</p>
        <p className="text-sm mt-1">Adaugă poze din panoul admin.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo, idx) => (
          <div
            key={photo.id}
            className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative"
            onClick={() => setLightbox(idx)}
          >
            <img
              src={photo.path}
              alt={photo.caption || 'Foto'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10" onClick={() => setLightbox(null)}>
            ✕
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 z-10"
            onClick={(e) => { e.stopPropagation(); setLightbox(Math.max(0, lightbox - 1)) }}
          >
            ‹
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 z-10"
            onClick={(e) => { e.stopPropagation(); setLightbox(Math.min(photos.length - 1, lightbox + 1)) }}
          >
            ›
          </button>
          <div className="max-w-5xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[lightbox].path}
              alt={photos[lightbox].caption || 'Foto'}
              className="max-w-full max-h-[85vh] object-contain mx-auto"
            />
            {photos[lightbox].caption && (
              <p className="text-white text-center mt-3 text-sm">{photos[lightbox].caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
