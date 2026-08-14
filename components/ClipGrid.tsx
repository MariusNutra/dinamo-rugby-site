'use client'

import { useState } from 'react'

interface Clip {
  id: string
  path: string
  posterPath: string | null
  title: string
  description: string | null
  grupa: string | null
  durationSec: number | null
}

function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Grila de filmulete incarcate ca fisier.
 *
 * `preload="none"` conteaza mai mult decat pare: cu valoarea implicita,
 * o pagina cu douazeci de clipuri ar incepe sa traga din fiecare cate ceva
 * inainte ca cineva sa apese play. Coperta e o imagine, filmul se descarca
 * doar cand omul chiar il porneste.
 */
export default function ClipGrid({ clips }: { clips: Clip[] }) {
  const [playing, setPlaying] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {clips.map(clip => {
        const duration = formatDuration(clip.durationSec)
        return (
          <figure key={clip.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="relative aspect-video bg-black">
              {playing === clip.id ? (
                <video
                  src={clip.path}
                  poster={clip.posterPath || undefined}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <button
                  onClick={() => setPlaying(clip.id)}
                  className="w-full h-full group relative"
                  aria-label={`Pornește filmulețul: ${clip.title}`}
                >
                  {clip.posterPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={clip.posterPath}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-dinamo-blue" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                    <span className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transition-colors">
                      <svg className="w-7 h-7 text-dinamo-red ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                  {duration && (
                    <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                      {duration}
                    </span>
                  )}
                  {clip.grupa && (
                    <span className="absolute top-2 left-2 bg-dinamo-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {clip.grupa}
                    </span>
                  )}
                </button>
              )}
            </div>

            <figcaption className="p-4">
              <h3 className="font-heading font-bold text-dinamo-blue leading-tight">{clip.title}</h3>
              {clip.description && (
                <p className="text-sm text-gray-600 mt-1">{clip.description}</p>
              )}
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}
