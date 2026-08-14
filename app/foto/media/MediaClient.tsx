'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MediaItem } from '@/lib/media-item'
import MediaUploader from './MediaUploader'
import MediaCard from './MediaCard'

type Filter = 'toate' | 'poze' | 'filmulete' | 'ciorne'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'toate', label: 'Toate' },
  { key: 'poze', label: 'Poze' },
  { key: 'filmulete', label: 'Filmulete' },
  { key: 'ciorne', label: 'Ciorne' },
]

export default function MediaClient() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('toate')

  useEffect(() => {
    fetch('/api/foto/media')
      .then(r => (r.ok ? r.json() : []))
      .then((data: MediaItem[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const handleUploaded = useCallback((fresh: MediaItem[]) => {
    setItems(prev => [...fresh, ...prev])
  }, [])

  const handleChange = useCallback((updated: MediaItem) => {
    setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)))
  }, [])

  const handleDelete = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const visible = useMemo(() => {
    switch (filter) {
      case 'poze':
        return items.filter(i => i.kind === 'photo')
      case 'filmulete':
        return items.filter(i => i.kind === 'video')
      case 'ciorne':
        return items.filter(i => !i.published)
      default:
        return items
    }
  }, [items, filter])

  const counts = useMemo(
    () => ({
      published: items.filter(i => i.published).length,
      drafts: items.filter(i => !i.published).length,
    }),
    [items]
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl">Poze si filmulete</h1>
        <p className="text-gray-500 text-sm mt-1">
          {counts.published} pe site &middot; {counts.drafts} in ciorna
        </p>
      </div>

      <MediaUploader onUploaded={handleUploaded} />

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-dinamo-red text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-center text-gray-400 py-12">
          {items.length === 0
            ? 'Nu ai incarcat nimic inca. Incepe cu butonul de mai sus.'
            : 'Nimic aici cu filtrul asta.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map(item => (
            <MediaCard
              key={item.id}
              item={item}
              onChange={handleChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
