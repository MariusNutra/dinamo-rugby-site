'use client'

import { useState } from 'react'

interface VideoCardProps {
  title: string
  youtubeId: string
  description?: string | null
}

export default function VideoCard({ title, youtubeId, description }: VideoCardProps) {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="rounded-xl overflow-hidden shadow-md bg-white">
      <div className="relative aspect-video">
        {!playing ? (
          <button
            onClick={() => setPlaying(true)}
            className="w-full h-full relative group cursor-pointer"
            aria-label={`Reda ${title}`}
          >
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <svg className="w-16 h-16 text-white drop-shadow-lg" viewBox="0 0 68 48" fill="none">
                <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74 0.06 13.05 0 24 0 24s0.06 10.95 1.48 16.26c0.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#FF0000"/>
                <path d="M27 34V14l18 10-18 10z" fill="white"/>
              </svg>
            </div>
          </button>
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading font-bold text-gray-900 line-clamp-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
        )}
      </div>
    </div>
  )
}
