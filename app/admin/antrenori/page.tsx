'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface Team {
  id: number
  grupa: string
}

interface Coach {
  id: string
  name: string
  description: string | null
  photo: string | null
  phone: string | null
  email: string | null
  certifications: string | null
  visible: boolean
  order: number
  teamId: number
  team: { grupa: string }
}

interface GroupedCoach {
  key: string
  name: string
  description: string | null
  photo: string | null
  phone: string | null
  email: string | null
  certifications: string | null
  visible: boolean
  order: number
  records: Coach[]
  teams: string[]
}

const emptyForm = {
  name: '',
  description: '',
  phone: '',
  email: '',
  certifications: '',
  teamId: 0,
  order: 0,
  visible: true,
}

function groupCoaches(coaches: Coach[]): GroupedCoach[] {
  const map = new Map<string, Coach[]>()
  for (const c of coaches) {
    const key = c.name.trim().toLowerCase()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(c)
  }
  const groups: GroupedCoach[] = []
  Array.from(map.entries()).forEach(([key, records]) => {
    const first = records[0]
    // Use the record with the longest description as representative
    const best = records.reduce((a, b) =>
      (b.description?.length || 0) > (a.description?.length || 0) ? b : a, first)
    groups.push({
      key,
      name: first.name,
      description: best.description,
      photo: records.find(r => r.photo)?.photo || null,
      phone: best.phone,
      email: best.email,
      certifications: best.certifications,
      visible: records.some(r => r.visible),
      order: Math.min(...records.map(r => r.order)),
      records,
      teams: records.map(r => r.team?.grupa).filter(Boolean),
    })
  })
  groups.sort((a, b) => a.order - b.order)
  return groups
}

export default function AdminAntrenori() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIds, setEditingIds] = useState<string[]>([])
  const [form, setForm] = useState({ ...emptyForm })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [coachRes, teamRes] = await Promise.all([
      fetch('/api/coaches'),
      fetch('/api/teams'),
    ])
    const coachData = await coachRes.json()
    const teamData = await teamRes.json()
    setCoaches(coachData)
    setTeams(teamData)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const grouped = groupCoaches(coaches)

  const openAdd = () => {
    setEditingIds([])
    setForm({ ...emptyForm, teamId: teams[0]?.id || 0 })
    setPhotoFile(null)
    setPhotoPreview(null)
    setModalOpen(true)
  }

  const openEditGroup = (g: GroupedCoach) => {
    setEditingIds(g.records.map(r => r.id))
    const first = g.records[0]
    const best = g.records.reduce((a, b) =>
      (b.description?.length || 0) > (a.description?.length || 0) ? b : a, first)
    setForm({
      name: first.name,
      description: best.description || '',
      phone: best.phone || '',
      email: best.email || '',
      certifications: best.certifications || '',
      teamId: first.teamId,
      order: g.order,
      visible: g.visible,
    })
    setPhotoFile(null)
    setPhotoPreview(g.photo || null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingIds([])
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const uploadPhoto = async (coachId: string): Promise<string | null> => {
    if (!photoFile) return null
    setUploading(true)
    const fd = new FormData()
    fd.append('file', photoFile)
    fd.append('coachId', coachId)
    const res = await fetch('/api/upload-antrenori', { method: 'POST', body: fd })
    setUploading(false)
    if (res.ok) {
      const data = await res.json()
      return data.url
    }
    return null
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.teamId) return
    setSaving(true)

    try {
      if (editingIds.length > 0) {
        // Update all records in the group with shared fields
        const shared = {
          name: form.name,
          description: form.description || null,
          phone: form.phone || null,
          email: form.email || null,
          certifications: form.certifications || null,
          visible: form.visible,
        }
        await Promise.all(editingIds.map(id =>
          fetch(`/api/coaches/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shared),
          })
        ))
        if (photoFile) {
          // Upload photo to first record, then sync URL to others
          const url = await uploadPhoto(editingIds[0])
          if (url && editingIds.length > 1) {
            await Promise.all(editingIds.slice(1).map(id =>
              fetch(`/api/coaches/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo: url }),
              })
            ))
          }
        }
      } else {
        // Create
        const res = await fetch('/api/coaches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            description: form.description || null,
            phone: form.phone || null,
            email: form.email || null,
            certifications: form.certifications || null,
            teamId: form.teamId,
            visible: form.visible,
          }),
        })
        if (res.ok && photoFile) {
          const created = await res.json()
          await uploadPhoto(created.id)
        }
      }

      closeModal()
      await loadData()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGroup = async (g: GroupedCoach) => {
    const msg = g.records.length > 1
      ? `Sigur vrei sa stergi antrenorul "${g.name}"? Are ${g.records.length} intrari (${g.teams.join(', ')}). Se vor sterge toate.`
      : `Sigur vrei sa stergi antrenorul "${g.name}"?`
    if (!confirm(msg)) return
    await Promise.all(g.records.map(r =>
      fetch(`/api/coaches/${r.id}`, { method: 'DELETE' })
    ))
    loadData()
  }

  const moveGroup = async (g: GroupedCoach, direction: 'up' | 'down') => {
    const idx = grouped.findIndex(gr => gr.key === g.key)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= grouped.length) return

    // Flatten back to coach IDs in new order
    const newGrouped = [...grouped]
    const temp = newGrouped[idx]
    newGrouped[idx] = newGrouped[swapIdx]
    newGrouped[swapIdx] = temp

    const allIds = newGrouped.flatMap(gr => gr.records.map(r => r.id))
    // Optimistic: reorder coaches
    const reordered = allIds.map((id, i) => {
      const c = coaches.find(co => co.id === id)!
      return { ...c, order: i }
    })
    setCoaches(reordered)

    await fetch('/api/coaches/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: allIds }),
    })
    loadData()
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const isEditing = editingIds.length > 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-heading font-bold text-2xl">Antrenori</h1>
        <button onClick={openAdd}
          className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-dinamo-dark transition-colors">
          + Adauga antrenor
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-6">{grouped.length} antrenori in total</p>

      {grouped.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-400">
          Nu exista antrenori. Adauga primul antrenor cu butonul de mai sus.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-5 py-3 w-[60px]">Poza</th>
                    <th className="text-left px-4 py-3">Nume</th>
                    <th className="text-center px-4 py-3 w-[140px]">Echipa</th>
                    <th className="text-left px-4 py-3">Descriere</th>
                    <th className="text-center px-3 py-3 w-[70px]">Vizibil</th>
                    <th className="text-center px-3 py-3 w-[55px]">Ord.</th>
                    <th className="text-right px-5 py-3 w-[180px]">Actiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {grouped.map((g, idx) => (
                    <tr key={g.key}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                      onClick={() => openEditGroup(g)}>
                      {/* Photo */}
                      <td className="px-5 py-3">
                        {g.photo ? (
                          <img src={g.photo} alt={g.name}
                            className="w-[48px] h-[48px] rounded-full object-cover" />
                        ) : (
                          <div className="w-[48px] h-[48px] rounded-full bg-dinamo-red/10 flex items-center justify-center text-dinamo-red text-sm font-bold">
                            {getInitials(g.name)}
                          </div>
                        )}
                      </td>
                      {/* Name */}
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900 text-[15px]">{g.name}</p>
                        {g.records.length > 1 && (
                          <span className="text-[10px] text-gray-400">{g.records.length} intrari in DB</span>
                        )}
                      </td>
                      {/* Teams */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {g.teams.map(t => (
                            <span key={t}
                              className="inline-block px-2.5 py-0.5 bg-dinamo-red/10 text-dinamo-red text-xs font-semibold rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      {/* Description */}
                      <td className="px-4 py-3">
                        {g.description ? (
                          <p className="text-xs text-gray-500 leading-relaxed max-w-[280px]"
                            title={g.description}>
                            {g.description.length > 80 ? g.description.substring(0, 80) + '...' : g.description}
                          </p>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      {/* Visible */}
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          g.visible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${g.visible ? 'bg-green-500' : 'bg-red-400'}`} />
                          {g.visible ? 'Da' : 'Nu'}
                        </span>
                      </td>
                      {/* Order */}
                      <td className="px-3 py-3 text-center text-sm text-gray-400 font-mono">{g.order}</td>
                      {/* Actions */}
                      <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => moveGroup(g, 'up')} disabled={idx === 0}
                            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-400 text-xs disabled:opacity-20 disabled:hover:border-gray-200 disabled:hover:text-gray-400 transition-colors"
                            title="Muta sus">&#9650;</button>
                          <button onClick={() => moveGroup(g, 'down')} disabled={idx === grouped.length - 1}
                            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-400 text-xs disabled:opacity-20 disabled:hover:border-gray-200 disabled:hover:text-gray-400 transition-colors"
                            title="Muta jos">&#9660;</button>
                          <button onClick={() => openEditGroup(g)}
                            className="px-2.5 py-1.5 rounded text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                            Editare
                          </button>
                          <button onClick={() => handleDeleteGroup(g)}
                            className="px-2.5 py-1.5 rounded text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                            Sterge
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {grouped.map((g, idx) => (
              <div key={g.key}
                className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => openEditGroup(g)}>
                <div className="flex items-start gap-3">
                  {/* Photo */}
                  {g.photo ? (
                    <img src={g.photo} alt={g.name}
                      className="w-[48px] h-[48px] rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-[48px] h-[48px] rounded-full bg-dinamo-red/10 flex items-center justify-center text-dinamo-red text-sm font-bold shrink-0">
                      {getInitials(g.name)}
                    </div>
                  )}
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-[15px] truncate">{g.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        g.visible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${g.visible ? 'bg-green-500' : 'bg-red-400'}`} />
                        {g.visible ? 'Vizibil' : 'Ascuns'}
                      </span>
                    </div>
                    {/* Team badges */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {g.teams.map(t => (
                        <span key={t}
                          className="inline-block px-2 py-0.5 bg-dinamo-red/10 text-dinamo-red text-[11px] font-semibold rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                    {/* Description */}
                    {g.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{g.description}</p>
                    )}
                  </div>
                </div>
                {/* Card actions */}
                <div className="flex items-center justify-end gap-1.5 mt-3 pt-3 border-t border-gray-100"
                  onClick={e => e.stopPropagation()}>
                  <button onClick={() => moveGroup(g, 'up')} disabled={idx === 0}
                    className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:text-gray-700 text-xs disabled:opacity-20 transition-colors"
                    title="Muta sus">&#9650;</button>
                  <button onClick={() => moveGroup(g, 'down')} disabled={idx === grouped.length - 1}
                    className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:text-gray-700 text-xs disabled:opacity-20 transition-colors"
                    title="Muta jos">&#9660;</button>
                  <button onClick={() => openEditGroup(g)}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    Editare
                  </button>
                  <button onClick={() => handleDeleteGroup(g)}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                    Sterge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <div>
                <h2 className="font-heading font-bold text-lg">
                  {isEditing ? 'Editeaza antrenor' : 'Antrenor nou'}
                </h2>
                {editingIds.length > 1 && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    Acest antrenor are {editingIds.length} intrari in DB (echipe diferite). Modificarile se aplica tuturor.
                  </p>
                )}
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Poza</label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    dragOver ? 'border-dinamo-red bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
                      <span className="text-xs text-gray-500">Click sau drag pentru a schimba</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">Drag & drop sau click pentru a selecta</span>
                      <span className="text-xs">Max 5MB, se redimensioneaza la 400x400</span>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
                <input type="text" required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descriere / Bio
                  <span className="text-gray-400 font-normal ml-2">{form.description.length}/500</span>
                </label>
                <textarea rows={3} value={form.description} maxLength={500}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Experienta, parcurs, filozofie de antrenament..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input type="tel" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+40..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
                </div>
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificari / Realizari</label>
                <textarea rows={3} value={form.certifications}
                  onChange={e => setForm({ ...form, certifications: e.target.value })}
                  placeholder={"Cate una pe linie, ex:\nFost international al echipei nationale\nCampion national de seniori"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
                <p className="text-xs text-gray-400 mt-1">Cate o realizare pe fiecare linie. Se afiseaza ca lista pe pagina publica.</p>
              </div>

              {/* Team + Order + Visible */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Echipa {!isEditing && '*'}
                  </label>
                  {isEditing && editingIds.length > 1 ? (
                    <div className="flex flex-wrap gap-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                      {coaches.filter(c => editingIds.includes(c.id)).map(c => (
                        <span key={c.id} className="px-2 py-0.5 bg-dinamo-red/10 text-dinamo-red text-xs font-semibold rounded-full">
                          {c.team?.grupa}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <select value={form.teamId}
                      onChange={e => setForm({ ...form, teamId: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none">
                      <option value={0} disabled>Selecteaza...</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.grupa}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordine</label>
                  <input type="number" value={form.order}
                    onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
                  <p className="text-xs text-gray-400 mt-1">Numar mic = apare primul</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vizibil pe site</label>
                  <button type="button"
                    onClick={() => setForm({ ...form, visible: !form.visible })}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-bold transition-colors border ${
                      form.visible
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-gray-50 border-gray-300 text-gray-400'
                    }`}>
                    {form.visible ? 'Da — vizibil' : 'Nu — ascuns'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving || uploading}
                  className="flex-1 bg-dinamo-red text-white py-2.5 rounded-lg font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50">
                  {saving || uploading ? 'Se salveaza...' : isEditing ? 'Salveaza' : 'Adauga antrenor'}
                </button>
                <button type="button" onClick={closeModal}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors">
                  Anuleaza
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
