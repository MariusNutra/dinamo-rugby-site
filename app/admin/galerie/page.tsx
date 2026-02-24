'use client'

import { useEffect, useState } from 'react'
import ImageUpload from '@/components/ImageUpload'

interface Photo {
  id: number
  path: string
  caption: string | null
  grupa: string | null
  createdAt: string
}

export default function AdminGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [grupa, setGrupa] = useState('')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)

  const load = () => fetch('/api/photos').then(r => r.json()).then(setPhotos)

  useEffect(() => { load() }, [])

  const handleUpload = async (files: File[]) => {
    setUploading(true)
    setUploadCount(0)

    for (let i = 0; i < files.length; i++) {
      const fd = new FormData()
      fd.append('files', files[i])
      if (grupa) fd.append('grupa', grupa)
      if (caption) fd.append('caption', caption)
      await fetch('/api/photos', { method: 'POST', body: fd })
      setUploadCount(i + 1)
    }

    setUploading(false)
    setUploadCount(0)
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Sigur vrei să ștergi această poză?')) return
    await fetch(`/api/photos/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Galerie Foto</h1>

      {/* Upload */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="font-heading font-bold text-lg mb-4">Încarcă poze noi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grupa</label>
            <select value={grupa} onChange={e => setGrupa(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none">
              <option value="">General</option>
              <option value="U10">U10</option>
              <option value="U12">U12</option>
              <option value="U14">U14</option>
              <option value="U16">U16</option>
              <option value="U18">U18</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descriere (opțional)</label>
            <input type="text" value={caption} onChange={e => setCaption(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none"
              placeholder="Descrierea pozelor" />
          </div>
        </div>
        <ImageUpload onUpload={handleUpload} />
        {uploading && (
          <div className="mt-4 text-center">
            <div className="animate-spin w-6 h-6 border-4 border-dinamo-red border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Se încarcă... ({uploadCount} procesate)</p>
          </div>
        )}
      </div>

      {/* Photos grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {photos.map(photo => (
          <div key={photo.id} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden">
              <img src={photo.path} alt={photo.caption || ''} className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <button onClick={() => handleDelete(photo.id)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold hover:bg-red-600">
                Șterge
              </button>
            </div>
            {photo.grupa && (
              <span className="absolute top-1 left-1 bg-dinamo-red text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                {photo.grupa}
              </span>
            )}
          </div>
        ))}
      </div>
      {photos.length === 0 && (
        <p className="text-center text-gray-400 py-8">Nu sunt poze încă. Încarcă primele!</p>
      )}
    </div>
  )
}
