'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Team {
  id: number
  grupa: string
}

interface ChildRow {
  id: string
  name: string
  birthYear: number
  teamId: number | null
  teamName: string | null
  parentName: string
}

interface ParentOption {
  id: string
  name: string
  email: string
}

const birthYearOptions: number[] = []
for (let y = 2022; y >= 2005; y--) {
  birthYearOptions.push(y)
}

export default function SportiviManagePage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [children, setChildren] = useState<ChildRow[]>([])
  const [filterTeam, setFilterTeam] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [parents, setParents] = useState<ParentOption[]>([])

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [formNume, setFormNume] = useState('')
  const [formPrenume, setFormPrenume] = useState('')
  const [formBirthYear, setFormBirthYear] = useState('')
  const [formTeamId, setFormTeamId] = useState('')
  const [formParentMode, setFormParentMode] = useState<'existing' | 'new'>('existing')
  const [formParentId, setFormParentId] = useState('')
  const [formParentName, setFormParentName] = useState('')
  const [formParentEmail, setFormParentEmail] = useState('')
  const [formParentPhone, setFormParentPhone] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const fetchData = () => {
    fetch('/api/teams').then(r => r.json()).then(data => {
      setTeams(data.filter((t: Team & { active?: boolean }) => t.active !== false))
    })
    fetch('/api/admin/parinti').then(r => r.json()).then(data => {
      if (!Array.isArray(data)) return
      const allChildren: ChildRow[] = []
      const allParents: ParentOption[] = []
      data.forEach((p: { id: string; name: string; email: string; children?: { id: string; name: string; birthYear: number; teamId: number | null; teamName?: string }[] }) => {
        allParents.push({ id: p.id, name: p.name, email: p.email })
        p.children?.forEach(c => {
          allChildren.push({
            id: c.id,
            name: c.name,
            birthYear: c.birthYear,
            teamId: c.teamId,
            teamName: c.teamName || null,
            parentName: p.name,
          })
        })
      })
      allChildren.sort((a, b) => a.name.localeCompare(b.name))
      allParents.sort((a, b) => a.name.localeCompare(b.name))
      setChildren(allChildren)
      setParents(allParents)
    })
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = children.filter(c => {
    if (filterTeam && c.teamId !== filterTeam) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const resetForm = () => {
    setFormNume('')
    setFormPrenume('')
    setFormBirthYear('')
    setFormTeamId('')
    setFormParentMode('existing')
    setFormParentId('')
    setFormParentName('')
    setFormParentEmail('')
    setFormParentPhone('')
    setFormError('')
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formNume.trim() || formNume.trim().length < 2) {
      setFormError('Numele este obligatoriu (min. 2 caractere)')
      return
    }
    if (!formPrenume.trim() || formPrenume.trim().length < 2) {
      setFormError('Prenumele este obligatoriu (min. 2 caractere)')
      return
    }
    if (!formBirthYear) {
      setFormError('Anul nasterii este obligatoriu')
      return
    }
    if (formParentMode === 'existing' && !formParentId) {
      setFormError('Selecteaza un parinte')
      return
    }
    if (formParentMode === 'new') {
      if (!formParentName.trim()) {
        setFormError('Numele parintelui este obligatoriu')
        return
      }
      if (!formParentEmail.trim()) {
        setFormError('Email-ul parintelui este obligatoriu')
        return
      }
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        nume: formNume.trim(),
        prenume: formPrenume.trim(),
        birthYear: parseInt(formBirthYear),
        teamId: formTeamId ? parseInt(formTeamId) : null,
      }

      if (formParentMode === 'existing') {
        payload.parentId = formParentId
      } else {
        payload.newParent = {
          name: formParentName.trim(),
          email: formParentEmail.trim(),
          phone: formParentPhone.trim() || null,
        }
      }

      const res = await fetch('/api/admin/sportivi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        setFormError(err.error || 'Eroare la salvare')
        setSaving(false)
        return
      }

      setSaving(false)
      setShowModal(false)
      resetForm()
      fetchData()
      showToast('Sportivul a fost adaugat cu succes!')
    } catch {
      setFormError('Eroare de retea')
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Sportivi</h1>
        <button
          onClick={() => { setShowModal(true); resetForm() }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
        >
          + Adauga sportiv
        </button>
      </div>

      {/* Team filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilterTeam(null)}
          className={`px-3 py-1.5 rounded-full text-sm ${!filterTeam ? 'bg-dinamo-red text-white' : 'bg-gray-100'}`}
        >
          Toti ({children.length})
        </button>
        {teams.map(t => {
          const count = children.filter(c => c.teamId === t.id).length
          return (
            <button
              key={t.id}
              onClick={() => setFilterTeam(t.id)}
              className={`px-3 py-1.5 rounded-full text-sm ${filterTeam === t.id ? 'bg-dinamo-red text-white' : 'bg-gray-100'}`}
            >
              {t.grupa} ({count})
            </button>
          )
        })}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Cauta sportiv..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
      />

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium">Nume</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">An nastere</th>
              <th className="text-left p-3 font-medium">Echipa</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Parinte</th>
              <th className="text-right p-3 font-medium">Profil</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-gray-600 hidden md:table-cell">{c.birthYear}</td>
                <td className="p-3">
                  {c.teamName ? (
                    <span className="text-xs bg-dinamo-blue text-white px-2 py-0.5 rounded-full">{c.teamName}</span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="p-3 text-gray-600 hidden md:table-cell">{c.parentName}</td>
                <td className="p-3 text-right">
                  <Link href={`/admin/sportivi/${c.id}`} className="text-dinamo-blue hover:underline text-xs font-medium">
                    Vezi profil &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">Nu exista sportivi.</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" onClick={() => { setShowModal(false); resetForm() }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="font-heading font-bold text-lg mb-4">Adauga sportiv</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nume + Prenume */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
                    <input
                      type="text"
                      required
                      value={formNume}
                      onChange={e => setFormNume(e.target.value)}
                      placeholder="ex: Popescu"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prenume *</label>
                    <input
                      type="text"
                      required
                      value={formPrenume}
                      onChange={e => setFormPrenume(e.target.value)}
                      placeholder="ex: Ion"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>

                {/* Birth year + Team */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">An nastere *</label>
                    <select
                      required
                      value={formBirthYear}
                      onChange={e => setFormBirthYear(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="">-- An --</option>
                      {birthYearOptions.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Echipa</label>
                    <select
                      value={formTeamId}
                      onChange={e => setFormTeamId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="">-- Fara echipa --</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.grupa}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Parent mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parinte</label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="parentMode"
                        checked={formParentMode === 'existing'}
                        onChange={() => setFormParentMode('existing')}
                        className="text-green-600 focus:ring-green-500"
                      />
                      Parinte existent
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="parentMode"
                        checked={formParentMode === 'new'}
                        onChange={() => setFormParentMode('new')}
                        className="text-green-600 focus:ring-green-500"
                      />
                      Parinte nou
                    </label>
                  </div>

                  {formParentMode === 'existing' ? (
                    <select
                      value={formParentId}
                      onChange={e => setFormParentId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="">-- Selecteaza parinte --</option>
                      {parents.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-3 bg-gray-50 rounded-lg p-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nume parinte *</label>
                        <input
                          type="text"
                          value={formParentName}
                          onChange={e => setFormParentName(e.target.value)}
                          placeholder="ex: Ion Popescu"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                        <input
                          type="email"
                          value={formParentEmail}
                          onChange={e => setFormParentEmail(e.target.value)}
                          placeholder="parinte@email.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
                        <input
                          type="tel"
                          value={formParentPhone}
                          onChange={e => setFormParentPhone(e.target.value)}
                          placeholder="07xx xxx xxx"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Error */}
                {formError && (
                  <p className="text-red-600 text-sm">{formError}</p>
                )}

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Se salveaza...' : 'Salveaza'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm() }}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                  >
                    Anuleaza
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
