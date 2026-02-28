'use client'

import { useState, useEffect, useCallback } from 'react'

interface Team {
  id: number
  grupa: string
}

interface DocItem {
  id: string
  title: string
  category: string
  filePath: string
  fileSize: number
  mimeType: string
  targetGroup: string
  teamId: number | null
  team: { grupa: string } | null
  uploadedBy: string | null
  createdAt: string
}

const categories = [
  { value: 'general', label: 'General' },
  { value: 'regulament', label: 'Regulament' },
  { value: 'medical', label: 'Medical' },
  { value: 'competitii', label: 'Competiții' },
  { value: 'contracte', label: 'Contracte' },
  { value: 'financiar', label: 'Financiar' },
]

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function fileIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊'
  if (mimeType.includes('image')) return '🖼️'
  return '📁'
}

export default function AdminDocumentePage() {
  const [documents, setDocuments] = useState<DocItem[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('general')
  const [targetGroup, setTargetGroup] = useState('all')
  const [teamId, setTeamId] = useState('')
  const [file, setFile] = useState<File | null>(null)

  // Filter
  const [filterCat, setFilterCat] = useState('all')

  const loadData = useCallback(async () => {
    const [docsRes, teamsRes] = await Promise.all([
      fetch('/api/admin/documents'),
      fetch('/api/teams'),
    ])
    if (docsRes.ok) setDocuments(await docsRes.json())
    if (teamsRes.ok) setTeams(await teamsRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const openModal = () => {
    setTitle('')
    setCategory('general')
    setTargetGroup('all')
    setTeamId('')
    setFile(null)
    setError('')
    setShowModal(true)
  }

  const handleUpload = async () => {
    if (!title.trim()) { setError('Titlul este obligatoriu'); return }
    if (!file) { setError('Selectează un fișier'); return }

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('category', category)
    formData.append('targetGroup', targetGroup)
    if (targetGroup === 'team' && teamId) {
      formData.append('teamId', teamId)
    }

    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Eroare la upload')
        setUploading(false)
        return
      }

      setShowModal(false)
      loadData()
      showSuccess('Document încărcat cu succes')
    } catch {
      setError('Eroare de conexiune')
    }
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/documents/${id}`, { method: 'DELETE' })
    if (res.ok) {
      loadData()
      showSuccess('Document șters')
    }
    setDeletingId(null)
  }

  const filtered = filterCat === 'all'
    ? documents
    : documents.filter(d => d.category === filterCat)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl">Documente</h1>
          <p className="text-sm text-gray-400">{documents.length} document{documents.length !== 1 ? 'e' : ''}</p>
        </div>
        <button
          onClick={openModal}
          className="px-4 py-2 bg-dinamo-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Încarcă document
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            filterCat === 'all' ? 'bg-dinamo-red text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Toate ({documents.length})
        </button>
        {categories.map(cat => {
          const count = documents.filter(d => d.category === cat.value).length
          if (count === 0) return null
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCat(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filterCat === cat.value ? 'bg-dinamo-red text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Documents list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📁</span>
          </div>
          <h3 className="font-heading font-bold text-lg text-gray-600 mb-1">Niciun document</h3>
          <p className="text-gray-400 text-sm">Încarcă primul document folosind butonul de mai sus.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
                <span className="text-2xl">{fileIcon(doc.mimeType)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">
                      {categories.find(c => c.value === doc.category)?.label || doc.category}
                    </span>
                    {doc.targetGroup === 'team' && doc.team && (
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                        {doc.team.grupa}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>{formatSize(doc.fileSize)}</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString('ro-RO')}</span>
                    <span>{doc.targetGroup === 'all' ? 'Toți părinții' : `Echipa ${doc.team?.grupa || ''}`}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-dinamo-blue hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Descarcă
                  </a>
                  {deletingId === doc.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                      >
                        Confirmă
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                      >
                        Anulează
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(doc.id)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Șterge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !uploading && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg text-gray-900">Încarcă document</h3>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titlu *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  placeholder="ex: Regulament intern 2026"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Target group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vizibil pentru</label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${
                    targetGroup === 'all' ? 'border-dinamo-red bg-red-50/50' : 'border-gray-200'
                  }`}>
                    <input type="radio" checked={targetGroup === 'all'} onChange={() => setTargetGroup('all')} className="text-dinamo-red" />
                    <span className="text-sm font-medium">Toți părinții</span>
                  </label>
                  <label className={`flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${
                    targetGroup === 'team' ? 'border-dinamo-red bg-red-50/50' : 'border-gray-200'
                  }`}>
                    <input type="radio" checked={targetGroup === 'team'} onChange={() => setTargetGroup('team')} className="text-dinamo-red" />
                    <span className="text-sm font-medium">O echipă</span>
                  </label>
                </div>
                {targetGroup === 'team' && (
                  <select
                    value={teamId}
                    onChange={e => setTeamId(e.target.value)}
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  >
                    <option value="">Selectează echipa</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.grupa}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fișier *</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-dinamo-red hover:bg-red-50/30 transition-colors">
                  {file ? (
                    <div className="text-center">
                      <span className="text-2xl">{fileIcon(file.type)}</span>
                      <p className="text-sm font-medium text-gray-700 mt-1">{file.name}</p>
                      <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (max 20MB)</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              {error && (
                <div className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Anulează
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 bg-dinamo-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {uploading ? 'Se încarcă...' : 'Încarcă'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
