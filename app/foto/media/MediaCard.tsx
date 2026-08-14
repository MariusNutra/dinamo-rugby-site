'use client'

import { useState } from 'react'
import type { MediaItem } from '@/lib/media-item'

const GRUPE = ['U10', 'U12', 'U14', 'U16', 'U18']

interface Props {
  item: MediaItem
  onChange: (item: MediaItem) => void
  onDelete: (id: string) => void
}

function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function MediaCard({ item, onChange, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title || '')
  const [description, setDescription] = useState(item.description || '')
  const [grupa, setGrupa] = useState(item.grupa || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const patch = async (data: Record<string, unknown>) => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/foto/media/${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const updated = await res.json()
      if (!res.ok) {
        setError(updated.error || 'Nu am putut salva.')
        return false
      }
      onChange(updated)
      return true
    } catch {
      setError('Conexiune intrerupta.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const handleSave = async () => {
    if (await patch({ title, description, grupa })) setEditing(false)
  }

  const handleDelete = async () => {
    const what = item.kind === 'video' ? 'filmuletul' : 'poza'
    if (!confirm(`Sigur stergi ${what}? Nu se mai poate recupera.`)) return

    setBusy(true)
    try {
      const res = await fetch(`/api/foto/media/${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
      })
      if (res.ok) onDelete(item.id)
      else setError('Nu am putut sterge.')
    } catch {
      setError('Conexiune intrerupta.')
    } finally {
      setBusy(false)
    }
  }

  const duration = formatDuration(item.durationSec)

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
      <div className="relative bg-gray-100 aspect-video">
        {item.kind === 'video' ? (
          <video
            src={item.url}
            poster={item.posterUrl || undefined}
            controls
            preload="none"
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.title || 'Poza incarcata'}
            className="w-full h-full object-cover"
          />
        )}

        <div className="absolute top-2 left-2 flex gap-1.5 pointer-events-none">
          {item.grupa && (
            <span className="bg-dinamo-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              {item.grupa}
            </span>
          )}
          {item.kind === 'video' && (
            <span className="bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              {duration ? `FILM ${duration}` : 'FILM'}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Titlu"
              aria-label="Titlu"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descriere"
              aria-label="Descriere"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
            />
            <select
              value={grupa}
              onChange={e => setGrupa(e.target.value)}
              aria-label="Grupa"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
            >
              <option value="">General</option>
              {GRUPE.map(g => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={busy}
                className="flex-1 bg-dinamo-red text-white text-sm font-bold py-2 rounded-lg hover:bg-dinamo-dark transition-colors disabled:opacity-60"
              >
                Salveaza
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setTitle(item.title || '')
                  setDescription(item.description || '')
                  setGrupa(item.grupa || '')
                }}
                className="px-4 text-sm text-gray-500 hover:text-gray-800"
              >
                Renunta
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-heading font-bold text-gray-900 leading-tight">
              {item.title || <span className="text-gray-400 font-normal">Fara titlu</span>}
            </h3>
            {item.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-3">{item.description}</p>
            )}

            <div className="mt-auto pt-4 flex items-center gap-2">
              <button
                onClick={() => patch({ published: !item.published })}
                disabled={busy}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-60 ${
                  item.published
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {item.published ? 'Pe site' : 'Ciorna'}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-gray-500 hover:text-dinamo-red transition-colors"
              >
                Editeaza
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="text-xs text-gray-400 hover:text-red-600 transition-colors ml-auto"
              >
                Sterge
              </button>
            </div>
          </>
        )}

        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  )
}
