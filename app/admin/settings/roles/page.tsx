'use client'

import { useState, useEffect, useCallback } from 'react'

// ---- Permission definitions (mirrors lib/permissions.ts for client use) ----

const PERMISSIONS: Record<string, string> = {
  'stories.view': 'Vizualizare povești',
  'stories.manage': 'Gestionare povești',
  'gallery.view': 'Vizualizare galerie',
  'gallery.manage': 'Gestionare galerie',
  'teams.view': 'Vizualizare echipe',
  'teams.manage': 'Gestionare echipe',
  'athletes.view': 'Vizualizare sportivi',
  'athletes.manage': 'Gestionare sportivi',
  'attendance.view': 'Vizualizare prezențe',
  'attendance.manage': 'Gestionare prezențe',
  'evaluations.view': 'Vizualizare evaluări',
  'evaluations.manage': 'Gestionare evaluări',
  'matches.view': 'Vizualizare meciuri',
  'matches.manage': 'Gestionare meciuri',
  'competitions.manage': 'Gestionare competiții',
  'parents.view': 'Vizualizare părinți',
  'parents.manage': 'Gestionare părinți',
  'requests.manage': 'Gestionare cereri',
  'registrations.manage': 'Gestionare înscrieri',
  'payments.view': 'Vizualizare plăți',
  'payments.manage': 'Gestionare plăți',
  'shop.manage': 'Gestionare magazin',
  'fundraising.manage': 'Gestionare fundraising',
  'settings.manage': 'Gestionare setări',
  'users.manage': 'Gestionare utilizatori',
  'documents.manage': 'Gestionare documente',
  'notifications.manage': 'Gestionare notificări',
}

const PERMISSION_GROUPS: { key: string; label: string; permissions: string[] }[] = [
  {
    key: 'continut',
    label: 'Conținut',
    permissions: ['stories.view', 'stories.manage', 'gallery.view', 'gallery.manage'],
  },
  {
    key: 'sport',
    label: 'Sport',
    permissions: [
      'teams.view', 'teams.manage',
      'athletes.view', 'athletes.manage',
      'attendance.view', 'attendance.manage',
      'evaluations.view', 'evaluations.manage',
      'matches.view', 'matches.manage',
      'competitions.manage',
    ],
  },
  {
    key: 'utilizatori',
    label: 'Utilizatori',
    permissions: ['parents.view', 'parents.manage', 'requests.manage', 'registrations.manage'],
  },
  {
    key: 'financiar',
    label: 'Financiar',
    permissions: ['payments.view', 'payments.manage', 'shop.manage', 'fundraising.manage'],
  },
  {
    key: 'setari',
    label: 'Setări',
    permissions: ['settings.manage', 'users.manage', 'documents.manage', 'notifications.manage'],
  },
]

// ---- Types ----

interface Role {
  id: number
  name: string
  label: string
  permissions: string[]
  isSystem: boolean
  userCount: number
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [editPerms, setEditPerms] = useState<string[]>([])
  const [editLabel, setEditLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/roles')
      if (res.ok) {
        const data = await res.json()
        setRoles(data)
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadRoles() }, [loadRoles])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const selectRole = (role: Role) => {
    setSelectedRoleId(role.id)
    setEditPerms([...role.permissions])
    setEditLabel(role.label)
    setError('')
  }

  const selectedRole = roles.find(r => r.id === selectedRoleId)

  const togglePerm = (perm: string) => {
    setEditPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    )
  }

  const toggleGroupAll = (groupPerms: string[]) => {
    const allChecked = groupPerms.every(p => editPerms.includes(p))
    if (allChecked) {
      setEditPerms(prev => prev.filter(p => !groupPerms.includes(p)))
    } else {
      setEditPerms(prev => Array.from(new Set([...prev, ...groupPerms])))
    }
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: editPerms, label: editLabel }),
      })

      if (res.ok) {
        const updated = await res.json()
        setRoles(prev => prev.map(r => r.id === updated.id ? updated : r))
        showSuccess(`Rolul "${updated.label}" a fost actualizat`)
      } else {
        const data = await res.json()
        setError(data.error || 'Eroare la salvare')
      }
    } catch {
      setError('Eroare de conexiune')
    }
    setSaving(false)
  }

  const handleSeed = async () => {
    setSeeding(true)
    setError('')

    try {
      const res = await fetch('/api/admin/roles/seed', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        showSuccess(data.message)
        loadRoles()
      } else {
        const data = await res.json()
        setError(data.error || 'Eroare la inițializare')
      }
    } catch {
      setError('Eroare de conexiune')
    }
    setSeeding(false)
  }

  const handleAddRole = async () => {
    if (!newName.trim() || !newLabel.trim()) {
      setError('Numele și eticheta sunt obligatorii')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), label: newLabel.trim(), permissions: [] }),
      })

      if (res.ok) {
        const role = await res.json()
        setRoles(prev => [...prev, role])
        setShowAddModal(false)
        setNewName('')
        setNewLabel('')
        showSuccess(`Rolul "${role.label}" a fost creat`)
        selectRole(role)
      } else {
        const data = await res.json()
        setError(data.error || 'Eroare la creare')
      }
    } catch {
      setError('Eroare de conexiune')
    }
    setSaving(false)
  }

  const handleDelete = async (roleId: number) => {
    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, { method: 'DELETE' })
      if (res.ok) {
        setRoles(prev => prev.filter(r => r.id !== roleId))
        if (selectedRoleId === roleId) {
          setSelectedRoleId(null)
        }
        showSuccess('Rolul a fost șters')
      } else {
        const data = await res.json()
        setError(data.error || 'Eroare la ștergere')
      }
    } catch {
      setError('Eroare de conexiune')
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl">Roluri și Permisiuni</h1>
          <p className="text-sm text-gray-400">{roles.length} rol{roles.length !== 1 ? 'uri' : ''} definite</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {seeding ? 'Se inițializează...' : 'Inițializează roluri'}
          </button>
          <button
            onClick={() => {
              setShowAddModal(true)
              setNewName('')
              setNewLabel('')
              setError('')
            }}
            className="px-4 py-2 bg-dinamo-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adaugă rol
          </button>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* Error message */}
      {error && !showAddModal && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* Empty state */}
      {roles.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-4xl mb-3">🔑</div>
          <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">Niciun rol definit</h3>
          <p className="text-sm text-gray-500 mb-4">
            Apasă &quot;Inițializează roluri&quot; pentru a crea rolurile implicite (Administrator, Editor, Antrenor, Manager, Secretar).
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-5 py-2.5 bg-dinamo-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {seeding ? 'Se creează...' : 'Inițializează roluri implicite'}
          </button>
        </div>
      )}

      {/* Role cards + permission editor */}
      {roles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roles list */}
          <div className="lg:col-span-1 space-y-3">
            {roles.map(role => (
              <div
                key={role.id}
                onClick={() => selectRole(role)}
                className={`bg-white rounded-xl shadow-md p-4 cursor-pointer transition-all border-2 ${
                  selectedRoleId === role.id
                    ? 'border-dinamo-red shadow-lg'
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-gray-900 truncate">{role.label}</h3>
                      {role.isSystem && (
                        <span className="shrink-0 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">
                          Sistem
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{role.name}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="text-xs text-gray-500">
                      {role.userCount} utilizator{role.userCount !== 1 ? 'i' : ''}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {role.permissions.length} permisiuni
                    </div>
                  </div>
                </div>

                {/* Delete button for non-system roles */}
                {!role.isSystem && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                    {deletingId === role.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(role.id)
                          }}
                          className="px-3 py-1 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                        >
                          Confirmă ștergerea
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingId(null)
                          }}
                          className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Anulează
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingId(role.id)
                        }}
                        className="px-3 py-1 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Șterge
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Permission editor */}
          <div className="lg:col-span-2">
            {selectedRole ? (
              <div className="bg-white rounded-xl shadow-md">
                {/* Editor header */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-sm font-medium text-gray-600">Etichetă:</label>
                        <input
                          type="text"
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-heading font-bold focus:ring-2 focus:ring-dinamo-red outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        Rol: <span className="font-mono">{selectedRole.name}</span>
                        {selectedRole.isSystem && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">
                            Sistem
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={handleSavePermissions}
                      disabled={saving}
                      className="px-5 py-2 bg-dinamo-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Se salvează...' : 'Salvează'}
                    </button>
                  </div>
                </div>

                {/* Permission groups */}
                <div className="px-6 py-4 space-y-6">
                  {PERMISSION_GROUPS.map(group => {
                    const allChecked = group.permissions.every(p => editPerms.includes(p))
                    const someChecked = group.permissions.some(p => editPerms.includes(p))

                    return (
                      <div key={group.key}>
                        {/* Group header with select all */}
                        <div className="flex items-center gap-3 mb-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allChecked}
                              ref={el => {
                                if (el) el.indeterminate = someChecked && !allChecked
                              }}
                              onChange={() => toggleGroupAll(group.permissions)}
                              className="w-4 h-4 rounded border-gray-300 text-dinamo-red focus:ring-dinamo-red"
                            />
                            <span className="text-sm font-heading font-bold text-gray-800 uppercase tracking-wide">
                              {group.label}
                            </span>
                          </label>
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="text-xs text-gray-400">
                            {group.permissions.filter(p => editPerms.includes(p)).length}/{group.permissions.length}
                          </span>
                        </div>

                        {/* Permission checkboxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-1">
                          {group.permissions.map(perm => (
                            <label
                              key={perm}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                                editPerms.includes(perm)
                                  ? 'bg-red-50/60 border border-red-200'
                                  : 'bg-gray-50 border border-transparent hover:border-gray-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={editPerms.includes(perm)}
                                onChange={() => togglePerm(perm)}
                                className="w-4 h-4 rounded border-gray-300 text-dinamo-red focus:ring-dinamo-red"
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-800">
                                  {PERMISSIONS[perm]}
                                </div>
                                <div className="text-[11px] text-gray-400 font-mono truncate">
                                  {perm}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Summary bar */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {editPerms.length} din {Object.keys(PERMISSIONS).length} permisiuni selectate
                  </span>
                  <button
                    onClick={handleSavePermissions}
                    disabled={saving}
                    className="px-5 py-2 bg-dinamo-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Se salvează...' : 'Salvează permisiuni'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-4xl mb-3 opacity-30">🔑</div>
                <p className="text-gray-400 text-sm">
                  Selectează un rol din lista din stânga pentru a-i edita permisiunile.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !saving && setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg text-gray-900">
                Adaugă rol nou
              </h3>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nume (cod intern) *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-dinamo-red outline-none"
                  placeholder="ex: video-editor"
                />
                <p className="text-xs text-gray-400 mt-1">Doar litere mici, cifre și cratimă</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etichetă (afișare) *
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                  placeholder="ex: Editor Video"
                />
              </div>

              {error && showAddModal && (
                <div className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Anulează
              </button>
              <button
                onClick={handleAddRole}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-dinamo-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Se creează...' : 'Creează rol'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
