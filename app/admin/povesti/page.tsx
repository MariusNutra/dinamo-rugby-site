'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ImageUpload from '@/components/ImageUpload'

interface Photo {
  id: number
  path: string
  caption: string | null
}

interface Story {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  coverImage: string | null
  videoUrl: string | null
  grupa: string | null
  published: boolean
  createdAt: string
  photos: Photo[]
}

const grupe = ['', 'U10', 'U12', 'U14', 'U16', 'U18']

export default function AdminStories() {
  const [stories, setStories] = useState<Story[]>([])
  const [editing, setEditing] = useState<Story | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [grupa, setGrupa] = useState('')
  const [published, setPublished] = useState(true)
  const [storyPhotos, setStoryPhotos] = useState<Photo[]>([])

  const editorRef = useRef<HTMLDivElement>(null)

  const loadStories = useCallback(() => {
    fetch('/api/stories?all=1').then(r => r.json()).then(setStories)
  }, [])

  useEffect(() => { loadStories() }, [loadStories])

  const resetForm = () => {
    setTitle('')
    setContent('')
    setExcerpt('')
    setCoverImage('')
    setVideoUrl('')
    setGrupa('')
    setPublished(true)
    setStoryPhotos([])
    setEditing(null)
    setCreating(false)
    if (editorRef.current) editorRef.current.innerHTML = ''
  }

  const startCreate = () => {
    resetForm()
    setCreating(true)
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = ''
      editorRef.current?.focus()
    }, 50)
  }

  const startEdit = (story: Story) => {
    setTitle(story.title)
    setContent(story.content)
    setExcerpt(story.excerpt || '')
    setCoverImage(story.coverImage || '')
    setVideoUrl(story.videoUrl || '')
    setGrupa(story.grupa || '')
    setPublished(story.published)
    setStoryPhotos(story.photos || [])
    setEditing(story)
    setCreating(false)
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = story.content
    }, 50)
  }

  const syncEditorContent = () => {
    if (editorRef.current) {
      return editorRef.current.innerHTML
    }
    return content
  }

  const execCmd = (cmd: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
  }

  const insertLink = () => {
    const url = prompt('URL:')
    if (url) execCmd('createLink', url)
  }

  const handleCoverUpload = async (files: File[]) => {
    setUploadingCover(true)
    const fd = new FormData()
    fd.append('files', files[0])
    const res = await fetch('/api/photos', { method: 'POST', body: fd })
    const photos = await res.json()
    if (photos[0]) setCoverImage(photos[0].path)
    setUploadingCover(false)
  }

  const handleGalleryUpload = async (files: File[]) => {
    setUploadingPhotos(true)
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    if (editing) fd.append('storyId', String(editing.id))
    const res = await fetch('/api/photos', { method: 'POST', body: fd })
    const newPhotos = await res.json()
    setStoryPhotos(prev => [...prev, ...newPhotos])
    setUploadingPhotos(false)
  }

  const removePhoto = async (photoId: number) => {
    if (!confirm('Ștergi această poză?')) return
    await fetch(`/api/photos/${photoId}`, { method: 'DELETE' })
    setStoryPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  const save = async () => {
    const currentContent = syncEditorContent()
    if (!title.trim() || !currentContent.trim()) {
      alert('Titlul și conținutul sunt obligatorii.')
      return
    }

    setSaving(true)
    const payload = {
      title: title.trim(),
      content: currentContent,
      excerpt: excerpt.trim() || currentContent.replace(/<[^>]*>/g, '').substring(0, 200),
      coverImage: coverImage || null,
      videoUrl: videoUrl.trim() || null,
      grupa: grupa || null,
      published,
    }

    let savedStory: Story

    if (editing) {
      const res = await fetch(`/api/stories/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      savedStory = await res.json()
    } else {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      savedStory = await res.json()
    }

    // Associate any uploaded photos with the story
    if (!editing && storyPhotos.length > 0 && savedStory.id) {
      for (const photo of storyPhotos) {
        await fetch(`/api/photos/${photo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId: savedStory.id }),
        })
      }
    }

    setSaving(false)
    resetForm()
    loadStories()
  }

  const deleteStory = async (id: number) => {
    if (!confirm('Sigur vrei să ștergi această poveste?')) return
    await fetch(`/api/stories/${id}`, { method: 'DELETE' })
    loadStories()
  }

  const togglePublished = async (story: Story) => {
    await fetch(`/api/stories/${story.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...story, published: !story.published }),
    })
    loadStories()
  }

  const isFormOpen = creating || editing !== null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Povești & Noutăți</h1>
        {!isFormOpen && (
          <button onClick={startCreate}
            className="bg-dinamo-red text-white px-5 py-2 rounded-lg font-bold hover:bg-dinamo-dark transition-colors">
            + Poveste nouă
          </button>
        )}
      </div>

      {/* ── Create / Edit form ── */}
      {isFormOpen && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="font-heading font-bold text-lg mb-4">
            {editing ? `Editează: ${editing.title}` : 'Poveste nouă'}
          </h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titlu *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Titlul poveștii..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none text-lg" />
            </div>

            {/* Content editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conținut *</label>
              {/* Toolbar */}
              <div className="flex flex-wrap gap-1 bg-gray-100 rounded-t-lg border border-gray-300 border-b-0 p-2">
                <button type="button" onClick={() => execCmd('bold')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-bold hover:bg-gray-50" title="Bold">B</button>
                <button type="button" onClick={() => execCmd('italic')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm italic hover:bg-gray-50" title="Italic">I</button>
                <button type="button" onClick={() => execCmd('underline')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm underline hover:bg-gray-50" title="Subliniat">U</button>
                <span className="w-px bg-gray-300 mx-1" />
                <button type="button" onClick={() => execCmd('formatBlock', '<h2>')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-bold hover:bg-gray-50" title="Titlu">H2</button>
                <button type="button" onClick={() => execCmd('formatBlock', '<h3>')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-bold hover:bg-gray-50" title="Subtitlu">H3</button>
                <button type="button" onClick={() => execCmd('formatBlock', '<p>')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50" title="Paragraf">P</button>
                <span className="w-px bg-gray-300 mx-1" />
                <button type="button" onClick={() => execCmd('insertUnorderedList')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50" title="Listă">&#8226; List</button>
                <button type="button" onClick={() => execCmd('insertOrderedList')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50" title="Listă numerotată">1. List</button>
                <button type="button" onClick={insertLink}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50" title="Link">Link</button>
                <button type="button" onClick={() => execCmd('removeFormat')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-red-500 hover:bg-gray-50" title="Șterge formatarea">Clear</button>
              </div>
              {/* Editable area */}
              <div
                ref={editorRef}
                contentEditable
                className="w-full min-h-[300px] px-4 py-3 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-dinamo-red outline-none prose prose-sm max-w-none bg-white"
                onInput={() => {
                  if (editorRef.current) setContent(editorRef.current.innerHTML)
                }}
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rezumat (opțional)</label>
              <textarea rows={2} value={excerpt} onChange={e => setExcerpt(e.target.value)}
                placeholder="Scurt rezumat pentru card-ul din lista de povești. Dacă lași gol, se generează automat din conținut."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none text-sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cover image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagine copertă</label>
                {coverImage ? (
                  <div className="relative">
                    <img src={coverImage} alt="Cover" className="w-full h-48 object-cover rounded-lg" />
                    <button onClick={() => setCoverImage('')}
                      className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-sm font-bold hover:bg-red-600">X</button>
                  </div>
                ) : (
                  <div>
                    {uploadingCover ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">Se încarcă...</div>
                    ) : (
                      <ImageUpload onUpload={handleCoverUpload} multiple={false} label="Încarcă imagine copertă" />
                    )}
                  </div>
                )}
              </div>

              {/* Video URL + Grupa + Published */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video YouTube (opțional)</label>
                  <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grupa (opțional)</label>
                  <select value={grupa} onChange={e => setGrupa(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none text-sm">
                    <option value="">— Fără grupă —</option>
                    {grupe.filter(Boolean).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dinamo-red" />
                  </label>
                  <span className="text-sm font-medium text-gray-700">{published ? 'Publicat' : 'Ciornă'}</span>
                </div>
              </div>
            </div>

            {/* Gallery photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Galerie foto (opțional)</label>
              {storyPhotos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-3">
                  {storyPhotos.map(photo => (
                    <div key={photo.id} className="relative group">
                      <img src={photo.path} alt="" className="w-full aspect-square object-cover rounded-lg" />
                      <button onClick={() => removePhoto(photo.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">X</button>
                    </div>
                  ))}
                </div>
              )}
              {uploadingPhotos ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-400 text-sm">Se încarcă pozele...</div>
              ) : (
                <ImageUpload onUpload={handleGalleryUpload} multiple={true} label="Adaugă poze la galerie" />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving}
                className="bg-dinamo-red text-white px-6 py-2 rounded-lg font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50">
                {saving ? 'Se salvează...' : editing ? 'Salvează modificările' : 'Publică povestea'}
              </button>
              <button onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors">
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stories list ── */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-heading font-bold text-lg">{stories.length} {stories.length === 1 ? 'poveste' : 'povești'}</h2>
        </div>
        {stories.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg mb-2">Nu sunt povești încă.</p>
            <p className="text-sm">Apasă &quot;+ Poveste nouă&quot; pentru a adăuga prima.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stories.map(story => (
              <div key={story.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  {story.coverImage ? (
                    <img src={story.coverImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dinamo-red to-dinamo-dark">
                      <span className="text-white/60 text-xs">DR</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 truncate">{story.title}</h3>
                    {story.grupa && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full flex-shrink-0">{story.grupa}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <time>{new Date(story.createdAt).toLocaleDateString('ro-RO', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${story.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {story.published ? 'Publicat' : 'Ciornă'}
                    </span>
                    {story.photos.length > 0 && (
                      <span className="text-gray-400">{story.photos.length} poze</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => togglePublished(story)}
                    className={`px-3 py-1.5 rounded text-xs font-medium ${story.published ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}>
                    {story.published ? 'Ascunde' : 'Publică'}
                  </button>
                  <button onClick={() => startEdit(story)}
                    className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-xs font-medium">
                    Editează
                  </button>
                  <button onClick={() => deleteStory(story.id)}
                    className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded text-xs font-medium">
                    Șterge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
