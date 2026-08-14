'use client'

import { useCallback, useId, useRef, useState } from 'react'
import type { MediaItem } from '@/lib/media-item'

const GRUPE = ['U10', 'U12', 'U14', 'U16', 'U18']

// Trebuie sa ramana in acord cu ALLOWED_* din API: aici doar filtram devreme,
// ca omul sa afle ca a ales un fisier gresit inainte sa astepte incarcarea.
const ACCEPT = '.jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.m4v,.mov,.webm'

interface Props {
  onUploaded: (items: MediaItem[]) => void
}

interface Rejected {
  name: string
  reason: string
}

export default function MediaUploader({ onUploaded }: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const [grupa, setGrupa] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [published, setPublished] = useState(true)

  const [dragActive, setDragActive] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [rejected, setRejected] = useState<Rejected[]>([])
  const [error, setError] = useState('')

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return

      setBusy(true)
      setError('')
      setRejected([])
      setProgress({ done: 0, total: files.length })

      const uploaded: MediaItem[] = []
      const refused: Rejected[] = []

      // Cate un fisier pe cerere: un filmulet de 200 MB trimis impreuna cu
      // altele ar tine bara la zero minute bune si ar cadea tot lotul odata.
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData()
        fd.append('files', files[i])
        if (grupa) fd.append('grupa', grupa)
        if (title) fd.append('title', title)
        if (description) fd.append('description', description)
        fd.append('published', String(published))

        try {
          const res = await fetch('/api/foto/media', { method: 'POST', body: fd })
          const data = await res.json()

          if (!res.ok) {
            refused.push({
              name: files[i].name,
              reason: data.rejected?.[0]?.reason || data.error || 'Eroare la incarcare',
            })
          } else {
            uploaded.push(...(data.saved || []))
            refused.push(...(data.rejected || []))
          }
        } catch {
          refused.push({ name: files[i].name, reason: 'Conexiune intrerupta' })
        }

        setProgress({ done: i + 1, total: files.length })
      }

      setBusy(false)
      setProgress({ done: 0, total: 0 })
      setRejected(refused)
      if (uploaded.length > 0) {
        onUploaded(uploaded)
        setTitle('')
        setDescription('')
      } else if (refused.length === 0) {
        setError('Nu s-a incarcat nimic.')
      }
      if (inputRef.current) inputRef.current.value = ''
    },
    [grupa, title, description, published, onUploaded]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      upload(Array.from(e.dataTransfer.files))
    },
    [upload]
  )

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h2 className="font-heading font-bold text-lg mb-1">Incarca poze si filmulete</h2>
      <p className="text-sm text-gray-500 mb-4">
        Datele de mai jos se aplica tuturor fisierelor din aceasta incarcare. Le poti
        schimba dupa aceea, pe fiecare in parte.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor={`${inputId}-grupa`} className="block text-sm font-medium text-gray-700 mb-1">
            Grupa
          </label>
          <select
            id={`${inputId}-grupa`}
            value={grupa}
            onChange={e => setGrupa(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none"
          >
            <option value="">General</option>
            {GRUPE.map(g => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${inputId}-titlu`} className="block text-sm font-medium text-gray-700 mb-1">
            Titlu
          </label>
          <input
            id={`${inputId}-titlu`}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="ex. Meci cu Steaua, 12 mai"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none"
          />
        </div>

        <div>
          <label htmlFor={`${inputId}-descriere`} className="block text-sm font-medium text-gray-700 mb-1">
            Descriere
          </label>
          <input
            id={`${inputId}-descriere`}
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none"
          />
        </div>
      </div>

      <fieldset className="mb-4">
        <legend className="block text-sm font-medium text-gray-700 mb-2">Unde ajung</legend>
        <div className="flex flex-wrap gap-3">
          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${published ? 'border-dinamo-red bg-dinamo-light' : 'border-gray-300'}`}>
            <input
              type="radio"
              name="publicare"
              checked={published}
              onChange={() => setPublished(true)}
              className="accent-dinamo-red"
            />
            <span className="text-sm font-medium">Pe site, imediat</span>
          </label>
          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${!published ? 'border-dinamo-red bg-dinamo-light' : 'border-gray-300'}`}>
            <input
              type="radio"
              name="publicare"
              checked={!published}
              onChange={() => setPublished(false)}
              className="accent-dinamo-red"
            />
            <span className="text-sm font-medium">Ciorna, doar aici</span>
          </label>
        </div>
      </fieldset>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive ? 'border-dinamo-red bg-dinamo-light' : 'border-gray-300'
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPT}
          disabled={busy}
          onChange={e => upload(Array.from(e.target.files || []))}
          className="hidden"
        />
        <label
          htmlFor={inputId}
          className="inline-block bg-dinamo-red text-white font-bold px-6 py-2.5 rounded-lg hover:bg-dinamo-dark transition-colors cursor-pointer"
        >
          Alege fisiere
        </label>
        <p className="text-sm text-gray-500 mt-3">
          sau trage-le aici &middot; poze pana la 25 MB, filmulete pana la 200 MB
        </p>
      </div>

      {busy && (
        <div className="mt-4 text-center">
          <div className="animate-spin w-6 h-6 border-4 border-dinamo-red border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">
            Se incarca... ({progress.done} din {progress.total})
          </p>
          <p className="text-xs text-gray-400 mt-1">Nu inchide pagina.</p>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {rejected.length > 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-900 mb-1">
            {rejected.length === 1 ? 'Un fisier nu a intrat:' : `${rejected.length} fisiere nu au intrat:`}
          </p>
          <ul className="text-sm text-amber-800 list-disc list-inside">
            {rejected.map((r, i) => (
              <li key={`${r.name}-${i}`}>
                {r.name} — {r.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
