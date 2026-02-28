'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

interface Video {
  id: number
  title: string
  youtubeUrl: string
  description: string | null
  grupa: string | null
  featured: boolean
  createdAt: string
}

interface Annotation {
  id: string
  videoId: number
  timestamp: number
  text: string
  author: string | null
  createdAt: string
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
  return null
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function VideoAnalysisPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)
  const [annotationsLoading, setAnnotationsLoading] = useState(false)
  const [newText, setNewText] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const timeInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    fetch('/api/admin/videos')
      .then(r => r.json())
      .then(data => {
        setVideos(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const loadAnnotations = useCallback((videoId: number) => {
    setAnnotationsLoading(true)
    fetch(`/api/admin/video-analysis/${videoId}/annotations`)
      .then(r => r.json())
      .then(data => {
        setAnnotations(Array.isArray(data) ? data : [])
        setAnnotationsLoading(false)
      })
      .catch(() => setAnnotationsLoading(false))
  }, [])

  const handleSelectVideo = (video: Video) => {
    setSelectedVideo(video)
    setAnnotations([])
    setCurrentTime(0)
    setVideoDuration(0)
    loadAnnotations(video.id)
  }

  // Listen for YouTube postMessage API to track time
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            setCurrentTime(data.info.currentTime)
          }
          if (typeof data.info.duration === 'number') {
            setVideoDuration(data.info.duration)
          }
        }
      } catch {
        // ignore non-JSON messages
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Initialize YouTube iframe API listener
  useEffect(() => {
    if (!selectedVideo || !iframeRef.current) return

    // Send a "listening" command to the YouTube iframe to enable postMessage events
    const iframe = iframeRef.current
    const sendListening = () => {
      try {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: 'listening' }),
          'https://www.youtube.com'
        )
      } catch {
        // ignore
      }
    }

    // YouTube iframe needs a moment to load
    const timer = setTimeout(sendListening, 1500)
    return () => clearTimeout(timer)
  }, [selectedVideo])

  const handleAddAnnotation = async () => {
    if (!selectedVideo) return
    if (!newText.trim()) {
      showToast('Scrie textul adnotarii', 'err')
      return
    }

    // Use the manual time input if provided, otherwise use currentTime
    const timestampToUse = timeInputRef.current?.value
      ? parseTimeInput(timeInputRef.current.value)
      : currentTime

    setSaving(true)
    try {
      const res = await fetch(
        `/api/admin/video-analysis/${selectedVideo.id}/annotations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': getCsrfToken(),
          },
          body: JSON.stringify({
            timestamp: timestampToUse,
            text: newText.trim(),
          }),
        }
      )

      if (res.ok) {
        showToast('Adnotare adaugata')
        setNewText('')
        if (timeInputRef.current) timeInputRef.current.value = ''
        loadAnnotations(selectedVideo.id)
      } else {
        const err = await res.json().catch(() => ({}))
        showToast(err.error || 'Eroare la salvare', 'err')
      }
    } catch {
      showToast('Eroare de retea', 'err')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAnnotation = async (annotationId: string) => {
    if (!selectedVideo) return
    if (!confirm('Sterge aceasta adnotare?')) return

    try {
      const res = await fetch(
        `/api/admin/video-analysis/${selectedVideo.id}/annotations/${annotationId}`,
        {
          method: 'DELETE',
          headers: { 'x-csrf-token': getCsrfToken() },
        }
      )

      if (res.ok) {
        showToast('Adnotare stearsa')
        loadAnnotations(selectedVideo.id)
      } else {
        showToast('Eroare la stergere', 'err')
      }
    } catch {
      showToast('Eroare de retea', 'err')
    }
  }

  const handleAnnotationClick = (annotation: Annotation) => {
    setHighlightedId(annotation.id)
    setTimeout(() => setHighlightedId(null), 2000)

    // Try to seek the YouTube player via postMessage
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [annotation.timestamp, true],
          }),
          'https://www.youtube.com'
        )
      } catch {
        // ignore
      }
    }
  }

  function parseTimeInput(value: string): number {
    const parts = value.split(':')
    if (parts.length === 2) {
      return Number(parts[0]) * 60 + Number(parts[1])
    }
    return Number(value) || 0
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const youtubeId = selectedVideo ? extractYouTubeId(selectedVideo.youtubeUrl) : null

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">
        Analiza Video
      </h1>

      {/* Video selector */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecteaza un video
        </label>
        <select
          value={selectedVideo?.id || ''}
          onChange={e => {
            const video = videos.find(v => v.id === Number(e.target.value))
            if (video) handleSelectVideo(video)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red"
        >
          <option value="">-- Alege un videoclip --</option>
          {videos.map(v => (
            <option key={v.id} value={v.id}>
              {v.title} {v.grupa ? `(${v.grupa})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedVideo && youtubeId && (
        <>
          {/* YouTube Player */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="font-heading font-bold text-lg text-dinamo-blue mb-4">
              {selectedVideo.title}
            </h2>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                className="absolute inset-0 w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
              <span>
                Timp curent: <strong className="text-dinamo-blue">{formatTimestamp(currentTime)}</strong>
              </span>
              {videoDuration > 0 && (
                <span>
                  Durata: <strong>{formatTimestamp(videoDuration)}</strong>
                </span>
              )}
            </div>

            {/* Timeline bar with annotation markers */}
            {videoDuration > 0 && annotations.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-1">Timeline adnotari</p>
                <div className="relative h-8 bg-gray-200 rounded-full overflow-visible">
                  {/* Current time indicator */}
                  <div
                    className="absolute top-0 bottom-0 bg-dinamo-blue/20 rounded-l-full"
                    style={{ width: `${(currentTime / videoDuration) * 100}%` }}
                  />
                  {/* Annotation markers */}
                  {annotations.map(ann => {
                    const pct = Math.min((ann.timestamp / videoDuration) * 100, 100)
                    return (
                      <button
                        key={ann.id}
                        onClick={() => handleAnnotationClick(ann)}
                        title={`${formatTimestamp(ann.timestamp)} - ${ann.text.slice(0, 50)}`}
                        className={`absolute top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-150 cursor-pointer ${
                          highlightedId === ann.id ? 'bg-yellow-400 scale-150' : 'bg-dinamo-red'
                        }`}
                        style={{ left: `calc(${pct}% - 6px)`, top: '50%', transform: `translateY(-50%) ${highlightedId === ann.id ? 'scale(1.5)' : ''}` }}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Timeline bar when no duration detected */}
            {(videoDuration === 0) && annotations.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-1">Timeline adnotari</p>
                <div className="relative h-8 bg-gray-200 rounded-full overflow-visible">
                  {(() => {
                    const maxTs = Math.max(...annotations.map(a => a.timestamp), 1)
                    return annotations.map(ann => {
                      const pct = Math.min((ann.timestamp / maxTs) * 100, 100)
                      return (
                        <button
                          key={ann.id}
                          onClick={() => handleAnnotationClick(ann)}
                          title={`${formatTimestamp(ann.timestamp)} - ${ann.text.slice(0, 50)}`}
                          className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-150 cursor-pointer ${
                            highlightedId === ann.id ? 'bg-yellow-400 scale-150' : 'bg-dinamo-red'
                          }`}
                          style={{ left: `calc(${pct}% - 6px)`, top: '50%', transform: 'translateY(-50%)' }}
                        />
                      )
                    })
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Add annotation form */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="font-heading font-bold text-base text-dinamo-blue mb-3">
              Adauga adnotare
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-shrink-0">
                <label className="block text-xs text-gray-500 mb-1">Timp (MM:SS)</label>
                <input
                  ref={timeInputRef}
                  type="text"
                  placeholder={formatTimestamp(currentTime)}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Text adnotare</label>
                <textarea
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  placeholder="Scrie observatia ta aici..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red"
                />
              </div>
              <div className="flex-shrink-0 flex items-end">
                <button
                  onClick={handleAddAnnotation}
                  disabled={saving}
                  className="px-5 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {saving ? 'Se salveaza...' : 'Adauga'}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Lasa campul de timp gol pentru a folosi timpul curent al playerului ({formatTimestamp(currentTime)})
            </p>
          </div>

          {/* Annotations list */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-heading font-bold text-base text-dinamo-blue mb-3">
              Adnotari ({annotations.length})
            </h3>
            {annotationsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-3 border-dinamo-red border-t-transparent rounded-full"></div>
              </div>
            ) : annotations.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                Nicio adnotare. Adauga prima adnotare mai sus.
              </p>
            ) : (
              <div className="space-y-2">
                {annotations.map(ann => (
                  <div
                    key={ann.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                      highlightedId === ann.id
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'border-gray-200'
                    }`}
                    onClick={() => handleAnnotationClick(ann)}
                  >
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-16 h-8 bg-dinamo-blue text-white text-xs font-mono font-bold rounded">
                      {formatTimestamp(ann.timestamp)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{ann.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {ann.author && (
                          <span className="text-xs text-gray-400">{ann.author}</span>
                        )}
                        <span className="text-xs text-gray-300">
                          {new Date(ann.createdAt).toLocaleDateString('ro-RO')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleDeleteAnnotation(ann.id)
                      }}
                      className="flex-shrink-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Sterge adnotare"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium z-50 ${
            toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
