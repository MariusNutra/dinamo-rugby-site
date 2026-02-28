'use client'

import { useState } from 'react'
import PhotoGrid from '@/components/PhotoGrid'

const grupe = ['Toate', 'U10', 'U12', 'U14', 'U16', 'U18']

interface Photo {
  id: number
  path: string
  caption: string | null
  grupa: string | null
}

export default function GalerieClient({ photos: allPhotos }: { photos: Photo[] }) {
  const [filter, setFilter] = useState('Toate')

  const photos = filter === 'Toate' ? allPhotos : allPhotos.filter(p => p.grupa === filter)

  return (
    <>
      <section className="bg-dinamo-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center fade-in">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-2">Galerie Foto</h1>
          <p className="text-lg opacity-80">Momente din viața echipei Dinamo Rugby Juniori</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filtre */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {grupe.map(g => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                filter === g
                  ? 'bg-dinamo-red text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </div>
            <h2 className="font-heading text-xl font-bold text-dinamo-blue mb-2">
              {filter !== 'Toate' ? `Nicio poză pentru ${filter}` : 'Galeria este goală'}
            </h2>
            <p className="text-gray-500">
              {filter !== 'Toate'
                ? 'Încearcă altă categorie sau revino curând pentru noi fotografii.'
                : 'Fotografiile vor fi adăugate în curând. Revino pentru surprize!'}
            </p>
          </div>
        ) : (
          <PhotoGrid photos={photos} />
        )}
      </div>
    </>
  )
}
