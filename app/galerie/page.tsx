'use client'

import { useState, useEffect } from 'react'
import PhotoGrid from '@/components/PhotoGrid'

const grupe = ['Toate', 'U10', 'U12', 'U14', 'U16', 'U18']

interface Photo {
  id: number
  path: string
  caption: string | null
  grupa: string | null
}

export default function GaleriePage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [filter, setFilter] = useState('Toate')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = filter === 'Toate' ? '' : `?grupa=${filter}`
    fetch(`/api/photos${params}`)
      .then(r => r.json())
      .then(data => { setPhotos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter])

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
              onClick={() => { setFilter(g); setLoading(true) }}
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

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Se încarcă...</p>
          </div>
        ) : (
          <PhotoGrid photos={photos} />
        )}
      </div>
    </>
  )
}
