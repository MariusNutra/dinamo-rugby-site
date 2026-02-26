'use client'

import { useState, useEffect } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

interface Video {
  id: string
  title: string
  youtubeUrl: string
  description: string
  grupa: string | null
  featured: boolean
  createdAt: string
}

interface Team {
  id: string
  name: string
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null
  // Handle various YouTube URL formats:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  // https://www.youtube.com/v/VIDEO_ID
  // https://www.youtube.com/shorts/VIDEO_ID
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  // If the string itself looks like a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
  return null
}

export default function AdminVideoHighlightsPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Video | null>(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [description, setDescription] = useState('')
  const [grupa, setGrupa] = useState('')
  const [featured, setFeatured] = useState(false)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadVideos = () => {
    fetch('/api/admin/videos')
      .then(r => r.json())
      .then(data => {
        setVideos(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const loadTeams = () => {
    fetch('/api/teams')
      .then(r => r.json())
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => {})
  }

  useEffect(() => {
    loadVideos()
    loadTeams()
  }, [])

  const resetForm = () => {
    setTitle('')
    setYoutubeUrl('')
    setDescription('')
    setGrupa('')
    setFeatured(false)
    setEditing(null)
    setCreating(false)
  }

  const startEdit = (v: Video) => {
    setTitle(v.title)
    setYoutubeUrl(v.youtubeUrl)
    setDescription(v.description)
    setGrupa(v.grupa || '')
    setFeatured(v.featured)
    setEditing(v)
    setCreating(false)
  }

  const handleSave = async () => {
    if (!title || !youtubeUrl) {
      showToast('Completeaza titlul si URL-ul YouTube', 'err')
      return
    }

    if (!extractYouTubeId(youtubeUrl)) {
      showToast('URL YouTube invalid', 'err')
      return
    }

    const body = {
      title,
      youtubeUrl,
      description,
      grupa: grupa || null,
      featured,
    }

    const url = editing
      ? `/api/admin/videos/${editing.id}`
      : '/api/admin/videos'

    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCsrfToken(),
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      showToast(editing ? 'Video actualizat' : 'Video adaugat')
      resetForm()
      loadVideos()
    } else {
      showToast('Eroare la salvare', 'err')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sterge videoclipul? Aceasta actiune este ireversibila.')) return

    const res = await fetch(`/api/admin/videos/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': getCsrfToken() },
    })

    if (res.ok) {
      showToast('Video sters')
      loadVideos()
    } else {
      showToast('Eroare la stergere', 'err')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">Video Highlights</h1>

      {(creating || editing) ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="font-heading font-bold text-lg mb-4">
            {editing ? 'Editeaza video' : 'Video nou'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titlu</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Titlul videoclipului" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL YouTube</label>
              <input type="text" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://www.youtube.com/watch?v=..." />
              {youtubeUrl && extractYouTubeId(youtubeUrl) && (
                <div className="mt-2">
                  <img
                    src={`https://img.youtube.com/vi/${extractYouTubeId(youtubeUrl)}/mqdefault.jpg`}
                    alt="Previzualizare"
                    className="w-48 rounded"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={4} placeholder="Descrierea videoclipului" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grupa</label>
              <select value={grupa} onChange={e => setGrupa(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">-- Fara grupa --</option>
                {teams.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-dinamo-red focus:ring-dinamo-red" />
                <span className="text-sm font-medium text-gray-700">Afiseaza pe pagina principala</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave}
                className="px-6 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                {editing ? 'Salveaza' : 'Adauga video'}
              </button>
              <button onClick={resetForm}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Anuleaza
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <button onClick={() => setCreating(true)}
            className="mb-4 px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm">
            + Video nou
          </button>

          {videos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <p className="text-gray-500">Niciun videoclip adaugat</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map(v => {
                const videoId = extractYouTubeId(v.youtubeUrl)
                return (
                  <div key={v.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    {videoId && (
                      <img
                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                        alt={v.title}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-heading font-bold text-sm line-clamp-2">{v.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {v.featured && (
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                            Homepage
                          </span>
                        )}
                        {v.grupa && (
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-dinamo-blue/10 text-dinamo-blue font-medium">
                            {v.grupa}
                          </span>
                        )}
                      </div>
                      {v.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{v.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(v.createdAt).toLocaleDateString('ro-RO')}
                      </p>
                      <div className="flex gap-1 mt-3">
                        <button onClick={() => startEdit(v)}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">Editeaza</button>
                        <button onClick={() => handleDelete(v.id)}
                          className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded">Sterge</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium z-50 ${
          toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
