'use client'

import { useState, useEffect } from 'react'

interface Child {
  id: string
  name: string
  birthYear: number
  teamName: string
}

interface Parent {
  id: string
  name: string
  email: string
  phone: string | null
  children: Child[]
  acorduriSigned: number
  acorduriTotal: number
}

interface TeamOption {
  id: number
  grupa: string
}

interface ChildRow {
  name: string
  birthYear: string
  teamId: string
}

const currentYear = new Date().getFullYear()
const birthYearOptions: number[] = []
for (let y = currentYear - 3; y >= currentYear - 20; y--) {
  birthYearOptions.push(y)
}

const emptyChildRow = (): ChildRow => ({ name: '', birthYear: '', teamId: '' })

export default function AdminParintiPage() {
  const [parents, setParents] = useState<Parent[]>([])
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [childRows, setChildRows] = useState<ChildRow[]>([emptyChildRow()])
  const [sendInvite, setSendInvite] = useState(true)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Invite loading state per parent id
  const [invitingId, setInvitingId] = useState<string | null>(null)

  const fetchParents = () => {
    fetch('/api/admin/parinti')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setParents(data)
        } else if (data.parents) {
          setParents(data.parents)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchParents()
    fetch('/api/teams?active=1')
      .then(r => r.ok ? r.json() : [])
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const resetForm = () => {
    setFormName('')
    setFormEmail('')
    setFormPhone('')
    setChildRows([emptyChildRow()])
    setSendInvite(true)
    setFormError('')
  }

  const handleAddChild = () => {
    setChildRows(prev => [...prev, emptyChildRow()])
  }

  const handleRemoveChild = (index: number) => {
    setChildRows(prev => prev.filter((_, i) => i !== index))
  }

  const handleChildChange = (index: number, field: keyof ChildRow, value: string) => {
    setChildRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formName.trim()) {
      setFormError('Numele parintelui este obligatoriu.')
      return
    }
    if (!formEmail.trim()) {
      setFormError('Email-ul este obligatoriu.')
      return
    }

    const validChildren = childRows.filter(c => c.name.trim())

    setSaving(true)
    try {
      const res = await fetch('/api/admin/parinti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || null,
          sendInvite,
          children: validChildren.map(c => ({
            name: c.name.trim(),
            birthYear: c.birthYear ? parseInt(c.birthYear) : null,
            teamId: c.teamId ? parseInt(c.teamId) : null,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setFormError(err.error || 'Eroare la salvare.')
        setSaving(false)
        return
      }

      setSaving(false)
      setShowForm(false)
      resetForm()
      fetchParents()
    } catch {
      setFormError('Eroare de rețea.')
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Sigur vrei să ștergi părintele "${name}" și toate datele asociate?`)) return
    await fetch(`/api/admin/parinti/${id}`, { method: 'DELETE' })
    fetchParents()
  }

  const handleInvite = async (id: string) => {
    setInvitingId(id)
    try {
      const res = await fetch(`/api/admin/parinti/${id}/invite`, { method: 'POST' })
      if (res.ok) {
        alert('Invitația a fost trimisă cu succes.')
      } else {
        const err = await res.json()
        alert(err.error || 'Eroare la trimiterea invitației.')
      }
    } catch {
      alert('Eroare de rețea.')
    }
    setInvitingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading">Parinti</h1>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); resetForm() }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
          >
            + Adauga parinte
          </button>
        )}
      </div>

      {/* Add parent form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-l-4 border-l-green-600 p-6 mb-8">
          <h2 className="font-heading font-bold text-lg mb-4">Parinte nou</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Parent fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nume parinte *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="ex: Ion Popescu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="parinte@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  placeholder="07xx xxx xxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>

            {/* Children section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Copii</label>
              <div className="space-y-3">
                {childRows.map((child, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-end bg-gray-50 rounded-lg p-3">
                    <div className="flex-1 w-full md:w-auto">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nume copil</label>
                      <input
                        type="text"
                        value={child.name}
                        onChange={e => handleChildChange(index, 'name', e.target.value)}
                        placeholder="Nume si prenume"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div className="w-full md:w-36">
                      <label className="block text-xs font-medium text-gray-600 mb-1">An nastere</label>
                      <select
                        value={child.birthYear}
                        onChange={e => handleChildChange(index, 'birthYear', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        <option value="">-- An --</option>
                        {birthYearOptions.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full md:w-40">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Echipa</label>
                      <select
                        value={child.teamId}
                        onChange={e => handleChildChange(index, 'teamId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        <option value="">-- Echipa --</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.grupa}</option>
                        ))}
                      </select>
                    </div>
                    {childRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChild(index)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-2 shrink-0"
                        title="Sterge copil"
                      >
                        Sterge
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddChild}
                className="mt-3 text-green-700 hover:text-green-800 text-sm font-medium hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                + Adauga copil
              </button>
            </div>

            {/* Send invite checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendInvite"
                checked={sendInvite}
                onChange={e => setSendInvite(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="sendInvite" className="text-sm text-gray-700">
                Trimite invitatie pe email
              </label>
            </div>

            {/* Error */}
            {formError && (
              <p className="text-red-600 text-sm">{formError}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Se salveaza...' : 'Salveaza parinte'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm() }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                Anuleaza
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Parents table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium">Nume</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Telefon</th>
              <th className="text-center px-4 py-3 font-medium">Copii</th>
              <th className="text-center px-4 py-3 font-medium">Acorduri</th>
              <th className="text-right px-4 py-3 font-medium">Actiuni</th>
            </tr>
          </thead>
          <tbody>
            {parents.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Niciun parinte inregistrat.
                </td>
              </tr>
            ) : (
              parents.map(parent => (
                <tr key={parent.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{parent.name}</td>
                  <td className="px-4 py-3 text-gray-700">{parent.email}</td>
                  <td className="px-4 py-3 text-gray-700">{parent.phone || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-dinamo-blue text-white text-xs font-bold">
                      {parent.children.length}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-medium ${
                      parent.acorduriSigned === parent.acorduriTotal && parent.acorduriTotal > 0
                        ? 'text-green-600'
                        : parent.acorduriSigned > 0
                          ? 'text-amber-600'
                          : 'text-gray-400'
                    }`}>
                      {parent.acorduriSigned}/{parent.acorduriTotal}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleInvite(parent.id)}
                        disabled={invitingId === parent.id}
                        className="text-dinamo-blue hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {invitingId === parent.id ? 'Se trimite...' : 'Trimite invitatie'}
                      </button>
                      <button
                        onClick={() => handleDelete(parent.id, parent.name)}
                        className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Sterge
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {parents.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Total: {parents.length} {parents.length === 1 ? 'parinte' : 'parinti'} &middot;{' '}
          {parents.reduce((sum, p) => sum + p.children.length, 0)} copii
        </div>
      )}
    </div>
  )
}
