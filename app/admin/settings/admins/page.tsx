'use client'

import { useState, useEffect, useCallback } from 'react'

interface AdminUser {
  id: number
  username: string
  name: string
  email: string | null
  role: string
  active: boolean
  createdAt: string
}

const roles = [
  { value: 'admin', label: 'Administrator', desc: 'Acces complet la toate funcțiile' },
  { value: 'editor', label: 'Editor', desc: 'Poate edita conținut, dar nu utilizatori' },
]

export default function AdminSettingsPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form fields
  const [formUsername, setFormUsername] = useState('')
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState('editor')

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        setUsers(await res.json())
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const openAddModal = () => {
    setEditingUser(null)
    setFormUsername('')
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormRole('editor')
    setError('')
    setShowModal(true)
  }

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user)
    setFormUsername(user.username)
    setFormName(user.name)
    setFormEmail(user.email || '')
    setFormPassword('')
    setFormRole(user.role)
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)

    if (!formName.trim()) {
      setError('Numele este obligatoriu')
      setSaving(false)
      return
    }

    try {
      if (editingUser) {
        // Update existing user
        const body: Record<string, unknown> = {
          name: formName,
          email: formEmail,
          role: formRole,
        }
        if (formPassword) body.password = formPassword

        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Eroare la salvare')
          setSaving(false)
          return
        }

        showSuccess(`${formName} a fost actualizat`)
      } else {
        // Create new user
        if (!formUsername.trim()) {
          setError('Username-ul este obligatoriu')
          setSaving(false)
          return
        }
        if (!formPassword || formPassword.length < 6) {
          setError('Parola trebuie să aibă minim 6 caractere')
          setSaving(false)
          return
        }

        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername,
            password: formPassword,
            name: formName,
            email: formEmail,
            role: formRole,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Eroare la creare')
          setSaving(false)
          return
        }

        showSuccess(`${formName} a fost adăugat`)
      }

      setShowModal(false)
      loadUsers()
    } catch {
      setError('Eroare de conexiune')
    }
    setSaving(false)
  }

  const handleToggleActive = async (user: AdminUser) => {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    })

    if (res.ok) {
      loadUsers()
      showSuccess(`${user.name} a fost ${user.active ? 'dezactivat' : 'activat'}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Eroare')
    }
  }

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      loadUsers()
      showSuccess('Utilizatorul a fost șters')
    } else {
      const data = await res.json()
      setError(data.error || 'Eroare la ștergere')
    }
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl">Utilizatori Admin</h1>
          <p className="text-sm text-gray-400">{users.length} utilizator{users.length !== 1 ? 'i' : ''}</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-dinamo-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adaugă utilizator
        </button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* Error message */}
      {error && !showModal && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Utilizator</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Nume</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Rol</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <span className="font-mono text-sm text-gray-800">{user.username}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">{user.name}</td>
                  <td className="px-5 py-3 text-gray-500">{user.email || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'Editor'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full cursor-pointer transition-colors ${
                        user.active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {user.active ? 'Activ' : 'Inactiv'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-dinamo-red hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Editează
                      </button>
                      {deletingId === user.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(user.id)}
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
                          onClick={() => setDeletingId(user.id)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Șterge
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !saving && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg text-gray-900">
                {editingUser ? 'Editează utilizator' : 'Adaugă utilizator nou'}
              </h3>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={e => setFormUsername(e.target.value)}
                  disabled={!!editingUser}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dinamo-red outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="ex: andrei.coach"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nume complet *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  placeholder="ex: Andrei Popescu"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  placeholder="ex: andrei@dinamorugby.ro"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'Parolă nouă (lasă gol pentru a păstra)' : 'Parolă *'}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  placeholder="Minim 6 caractere"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rol</label>
                <div className="space-y-2">
                  {roles.map(r => (
                    <label key={r.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formRole === r.value ? 'border-dinamo-red bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={formRole === r.value}
                        onChange={() => setFormRole(r.value)}
                        className="mt-0.5 text-dinamo-red focus:ring-dinamo-red"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{r.label}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Anulează
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-dinamo-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Se salvează...' : editingUser ? 'Salvează' : 'Creează'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
