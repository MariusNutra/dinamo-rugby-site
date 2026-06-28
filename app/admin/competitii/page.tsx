'use client'

import { useEffect, useState, useCallback } from 'react'
import { emptyForm, emptyMatchForm } from './_constants'
import type { Competition, CompetitionForm, EditCompetitionForm, MatchFormState } from './_types'
import CompetitionCard from './_components/CompetitionCard'
import CreateCompetitionModal from './_components/CreateCompetitionModal'
import EditCompetitionModal from './_components/EditCompetitionModal'
import AddMatchModal from './_components/AddMatchModal'

export default function AdminCompetitii() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [showTeamInput, setShowTeamInput] = useState<string | null>(null)
  const [newTeamName, setNewTeamName] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedData, setExpandedData] = useState<Competition | null>(null)
  const [form, setForm] = useState<CompetitionForm>({ ...emptyForm })
  const [editForm, setEditForm] = useState<EditCompetitionForm>({ ...emptyForm, id: '' })
  const [matchForm, setMatchForm] = useState<MatchFormState>({ ...emptyMatchForm })
  const [saving, setSaving] = useState(false)
  const [recalculating, setRecalculating] = useState(false)

  const loadCompetitions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/competitions')
      if (res.ok) {
        const data = await res.json()
        setCompetitions(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCompetitions()
  }, [loadCompetitions])

  const loadExpanded = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/competitions/${id}`)
      if (res.ok) {
        const data = await res.json()
        setExpandedData(data)
      }
    } catch {
      // ignore
    }
  }, [])

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedData(null)
    } else {
      setExpandedId(id)
      loadExpanded(id)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const teams = form.teamsText
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(teamName => ({ teamName }))

    try {
      const res = await fetch('/api/admin/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          season: form.season || null,
          category: form.category || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          description: form.description || null,
          teams,
        }),
      })
      if (res.ok) {
        setShowCreateModal(false)
        setForm({ ...emptyForm })
        loadCompetitions()
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/competitions/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          type: editForm.type,
          season: editForm.season || null,
          category: editForm.category || null,
          startDate: editForm.startDate || null,
          endDate: editForm.endDate || null,
          description: editForm.description || null,
        }),
      })
      if (res.ok) {
        setShowEditModal(false)
        loadCompetitions()
        if (expandedId === editForm.id) loadExpanded(editForm.id)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (comp: Competition) => {
    setEditForm({
      id: comp.id,
      name: comp.name,
      type: comp.type,
      season: comp.season || '',
      category: comp.category || '',
      startDate: comp.startDate ? comp.startDate.slice(0, 10) : '',
      endDate: comp.endDate ? comp.endDate.slice(0, 10) : '',
      description: comp.description || '',
      teamsText: '',
    })
    setShowEditModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sigur vrei sa stergi aceasta competitie? Se vor sterge si echipele asociate.')) return
    try {
      await fetch(`/api/admin/competitions/${id}`, { method: 'DELETE' })
      if (expandedId === id) {
        setExpandedId(null)
        setExpandedData(null)
      }
      loadCompetitions()
    } catch {
      // ignore
    }
  }

  const handleRecalculate = async (id: string) => {
    setRecalculating(true)
    try {
      const res = await fetch(`/api/admin/competitions/${id}/standings`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setExpandedData(data)
        loadCompetitions()
      }
    } catch {
      // ignore
    } finally {
      setRecalculating(false)
    }
  }

  const handleAddTeam = async (competitionId: string) => {
    if (!newTeamName.trim()) return
    setSaving(true)
    try {
      // We'll use a direct prisma approach via a simple API - add team by creating via competition update
      // Since we don't have a dedicated team endpoint, we'll create one inline
      const res = await fetch(`/api/admin/competitions/${competitionId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: newTeamName.trim() }),
      })
      if (res.ok) {
        setNewTeamName('')
        setShowTeamInput(null)
        loadExpanded(competitionId)
        loadCompetitions()
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTeam = async (competitionId: string, teamId: string) => {
    if (!confirm('Sigur vrei sa stergi aceasta echipa din competitie?')) return
    try {
      await fetch(`/api/admin/competitions/${competitionId}/teams/${teamId}`, {
        method: 'DELETE',
      })
      loadExpanded(competitionId)
      loadCompetitions()
    } catch {
      // ignore
    }
  }

  const openMatchModal = (comp: Competition) => {
    setMatchForm({
      ...emptyMatchForm,
      category: comp.category || '',
    })
    setShowMatchModal(true)
  }

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expandedId) return
    setSaving(true)
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: matchForm.category || 'General',
          matchType: matchForm.matchType,
          round: matchForm.round || null,
          date: matchForm.date,
          location: matchForm.location || null,
          homeTeam: matchForm.homeTeam,
          awayTeam: matchForm.awayTeam,
          homeScore: matchForm.homeScore !== '' ? parseInt(matchForm.homeScore) : null,
          awayScore: matchForm.awayScore !== '' ? parseInt(matchForm.awayScore) : null,
          isDinamo: false,
          notes: matchForm.notes || null,
          competitionId: expandedId,
        }),
      })
      if (res.ok) {
        setShowMatchModal(false)
        setMatchForm({ ...emptyMatchForm })
        loadExpanded(expandedId)
        loadCompetitions()
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Competitii & Turnee</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-dinamo-red text-white px-5 py-2 rounded-lg font-bold hover:bg-dinamo-dark transition-colors text-sm"
        >
          + Adauga competitie
        </button>
      </div>

      {/* Competition cards */}
      {competitions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-400 text-lg">Nu exista competitii.</p>
          <p className="text-gray-400 text-sm mt-2">Adauga prima competitie folosind butonul de mai sus.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {competitions.map(comp => (
            <CompetitionCard
              key={comp.id}
              comp={comp}
              expanded={expandedId === comp.id}
              expandedData={expandedId === comp.id ? expandedData : null}
              recalculating={recalculating}
              saving={saving}
              showTeamInput={showTeamInput === comp.id}
              newTeamName={newTeamName}
              onNewTeamNameChange={setNewTeamName}
              onToggleExpand={() => toggleExpand(comp.id)}
              onStartEdit={() => startEdit(comp)}
              onDelete={() => handleDelete(comp.id)}
              onShowTeamInput={() => setShowTeamInput(comp.id)}
              onOpenMatchModal={() => openMatchModal(comp)}
              onRecalculate={() => handleRecalculate(comp.id)}
              onAddTeam={() => handleAddTeam(comp.id)}
              onCancelTeamInput={() => { setShowTeamInput(null); setNewTeamName('') }}
              onDeleteTeam={(teamId) => handleDeleteTeam(comp.id, teamId)}
            />
          ))}
        </div>
      )}

      {/* Create Competition Modal */}
      {showCreateModal && (
        <CreateCompetitionModal
          form={form}
          setForm={setForm}
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
          onCancel={() => { setShowCreateModal(false); setForm({ ...emptyForm }) }}
          saving={saving}
        />
      )}

      {/* Edit Competition Modal */}
      {showEditModal && (
        <EditCompetitionModal
          editForm={editForm}
          setEditForm={setEditForm}
          onSubmit={handleEdit}
          onClose={() => setShowEditModal(false)}
          saving={saving}
        />
      )}

      {/* Add Match Modal */}
      {showMatchModal && (
        <AddMatchModal
          matchForm={matchForm}
          setMatchForm={setMatchForm}
          onSubmit={handleAddMatch}
          onClose={() => setShowMatchModal(false)}
          saving={saving}
        />
      )}
    </div>
  )
}
