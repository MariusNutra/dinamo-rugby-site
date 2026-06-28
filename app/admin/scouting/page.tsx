'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'
import Link from 'next/link'
import type { Prospect, ScoutingReport } from './_types'
import { STATUS_COLUMNS, STATUS_BORDER_COLORS, STATUS_BG_COLORS } from './_constants'
import { StarRating } from './_components/StarRating'
import { ProspectDetailModal } from './_components/ProspectDetailModal'
import { AddProspectModal } from './_components/AddProspectModal'
import { AddReportModal } from './_components/AddReportModal'

export default function AdminScoutingPage() {
  const [tab, setTab] = useState<'pipeline' | 'rapoarte'>('pipeline')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [reports, setReports] = useState<ScoutingReport[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  // Prospect detail modal
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [editingProspect, setEditingProspect] = useState<Partial<Prospect>>({})

  // Add prospect modal
  const [addingProspect, setAddingProspect] = useState(false)
  const [newProspect, setNewProspect] = useState<Partial<Prospect>>({
    name: '', birthYear: undefined, position: '', currentClub: '', notes: '',
    rating: 0, status: 'identified', phone: '', email: '', scoutingReportId: null,
  })

  // Report modal
  const [addingReport, setAddingReport] = useState(false)
  const [reportForm, setReportForm] = useState({
    eventName: '', eventDate: '', location: '', notes: '',
  })

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadProspects = useCallback(() => {
    fetch('/api/admin/scouting/prospects')
      .then(r => r.json())
      .then(data => {
        setProspects(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
  }, [])

  const loadReports = useCallback(() => {
    fetch('/api/admin/scouting')
      .then(r => r.json())
      .then(data => {
        setReports(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/scouting/prospects').then(r => r.json()),
      fetch('/api/admin/scouting').then(r => r.json()),
    ]).then(([prospectsData, reportsData]) => {
      setProspects(Array.isArray(prospectsData) ? prospectsData : [])
      setReports(Array.isArray(reportsData) ? reportsData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // --- Prospect CRUD ---

  const handleStatusChange = async (prospectId: string, newStatus: string) => {
    const res = await fetch(`/api/admin/scouting/prospects/${prospectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      loadProspects()
      if (selectedProspect?.id === prospectId) {
        setSelectedProspect(prev => prev ? { ...prev, status: newStatus } : null)
        setEditingProspect(prev => ({ ...prev, status: newStatus }))
      }
      showToast('Status actualizat')
    } else {
      showToast('Eroare la actualizare status', 'err')
    }
  }

  const openProspectDetail = (p: Prospect) => {
    setSelectedProspect(p)
    setEditingProspect({ ...p })
  }

  const handleSaveProspect = async () => {
    if (!selectedProspect) return
    const res = await fetch(`/api/admin/scouting/prospects/${selectedProspect.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
      body: JSON.stringify({
        name: editingProspect.name,
        birthYear: editingProspect.birthYear || null,
        position: editingProspect.position || null,
        currentClub: editingProspect.currentClub || null,
        notes: editingProspect.notes || null,
        rating: editingProspect.rating ?? 0,
        status: editingProspect.status,
        phone: editingProspect.phone || null,
        email: editingProspect.email || null,
      }),
    })
    if (res.ok) {
      showToast('Prospect salvat')
      setSelectedProspect(null)
      loadProspects()
    } else {
      showToast('Eroare la salvare', 'err')
    }
  }

  const handleDeleteProspect = async (id: string) => {
    if (!confirm('Sterge acest prospect?')) return
    const res = await fetch(`/api/admin/scouting/prospects/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': getCsrfToken() },
    })
    if (res.ok) {
      showToast('Prospect sters')
      setSelectedProspect(null)
      loadProspects()
    } else {
      showToast('Eroare la stergere', 'err')
    }
  }

  const handleCreateProspect = async () => {
    if (!newProspect.name) {
      showToast('Numele este obligatoriu', 'err')
      return
    }
    const res = await fetch('/api/admin/scouting/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
      body: JSON.stringify({
        name: newProspect.name,
        birthYear: newProspect.birthYear || null,
        position: newProspect.position || null,
        currentClub: newProspect.currentClub || null,
        notes: newProspect.notes || null,
        rating: newProspect.rating ?? 0,
        status: newProspect.status || 'identified',
        phone: newProspect.phone || null,
        email: newProspect.email || null,
        scoutingReportId: newProspect.scoutingReportId || null,
      }),
    })
    if (res.ok) {
      showToast('Prospect adaugat')
      setAddingProspect(false)
      setNewProspect({
        name: '', birthYear: undefined, position: '', currentClub: '', notes: '',
        rating: 0, status: 'identified', phone: '', email: '', scoutingReportId: null,
      })
      loadProspects()
    } else {
      showToast('Eroare la creare', 'err')
    }
  }

  // --- Report CRUD ---

  const handleCreateReport = async () => {
    if (!reportForm.eventName || !reportForm.eventDate) {
      showToast('Numele si data evenimentului sunt obligatorii', 'err')
      return
    }
    const res = await fetch('/api/admin/scouting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
      body: JSON.stringify(reportForm),
    })
    if (res.ok) {
      showToast('Raport creat')
      setAddingReport(false)
      setReportForm({ eventName: '', eventDate: '', location: '', notes: '' })
      loadReports()
    } else {
      showToast('Eroare la creare raport', 'err')
    }
  }

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Sterge raportul? Prospectii asociati vor fi de asemenea stersi.')) return
    const res = await fetch(`/api/admin/scouting/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': getCsrfToken() },
    })
    if (res.ok) {
      showToast('Raport sters')
      loadReports()
      loadProspects()
    } else {
      showToast('Eroare la stergere', 'err')
    }
  }

  // --- Group prospects by status ---
  const prospectsByStatus: Record<string, Prospect[]> = {}
  STATUS_COLUMNS.forEach(col => {
    prospectsByStatus[col.key] = prospects.filter(p => p.status === col.key)
  })

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-dinamo-blue">Scouting & Recrutare</h1>
        {tab === 'pipeline' && (
          <button
            onClick={() => setAddingProspect(true)}
            className="px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            + Prospect nou
          </button>
        )}
        {tab === 'rapoarte' && (
          <button
            onClick={() => setAddingReport(true)}
            className="px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            + Raport nou
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('pipeline')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'pipeline' ? 'bg-white shadow text-dinamo-blue' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Pipeline
        </button>
        <button
          onClick={() => setTab('rapoarte')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'rapoarte' ? 'bg-white shadow text-dinamo-blue' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Rapoarte
        </button>
      </div>

      {/* Pipeline View */}
      {tab === 'pipeline' && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {STATUS_COLUMNS.map(col => (
              <div key={col.key} className="bg-white rounded-lg shadow-sm border p-3 text-center">
                <div className={`text-2xl font-bold ${
                  col.color === 'gray' ? 'text-gray-600' :
                  col.color === 'blue' ? 'text-blue-600' :
                  col.color === 'amber' ? 'text-amber-600' :
                  col.color === 'green' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {prospectsByStatus[col.key]?.length || 0}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{col.label}</div>
              </div>
            ))}
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STATUS_COLUMNS.map(col => (
              <div key={col.key} className="bg-gray-50 rounded-lg p-3 min-h-[400px]">
                <h3 className={`font-heading font-bold text-sm mb-3 px-1 ${
                  col.color === 'gray' ? 'text-gray-600' :
                  col.color === 'blue' ? 'text-blue-600' :
                  col.color === 'amber' ? 'text-amber-600' :
                  col.color === 'green' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {col.label} ({prospectsByStatus[col.key]?.length || 0})
                </h3>
                <div className="space-y-2">
                  {prospectsByStatus[col.key]?.map(prospect => (
                    <div
                      key={prospect.id}
                      onClick={() => openProspectDetail(prospect)}
                      className={`bg-white rounded-lg shadow-sm p-3 border-l-4 ${STATUS_BORDER_COLORS[prospect.status]} cursor-pointer hover:shadow-md transition-shadow`}
                    >
                      <div className="font-medium text-sm text-gray-900">{prospect.name}</div>
                      {prospect.birthYear && (
                        <div className="text-xs text-gray-500 mt-0.5">{prospect.birthYear}</div>
                      )}
                      {prospect.position && (
                        <div className="text-xs text-gray-500">{prospect.position}</div>
                      )}
                      {prospect.currentClub && (
                        <div className="text-xs text-gray-400 mt-0.5">{prospect.currentClub}</div>
                      )}
                      <div className="mt-1.5">
                        <StarRating rating={prospect.rating} readonly />
                      </div>
                      {/* Status dropdown */}
                      <div className="mt-2">
                        <select
                          value={prospect.status}
                          onChange={e => {
                            e.stopPropagation()
                            handleStatusChange(prospect.id, e.target.value)
                          }}
                          onClick={e => e.stopPropagation()}
                          className={`text-xs px-2 py-1 rounded-md border-0 w-full ${STATUS_BG_COLORS[prospect.status]}`}
                        >
                          {STATUS_COLUMNS.map(s => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Reports View */}
      {tab === 'rapoarte' && (
        <div>
          {reports.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <p className="text-gray-500">Niciun raport de scouting</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map(report => (
                <div key={report.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      href={`/admin/scouting/raport/${report.id}`}
                      className="font-heading font-bold text-dinamo-blue hover:underline"
                    >
                      {report.eventName}
                    </Link>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="text-xs text-red-500 hover:text-red-700 ml-2 shrink-0"
                    >
                      Sterge
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    {new Date(report.eventDate).toLocaleDateString('ro-RO', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </div>
                  {report.location && (
                    <div className="text-sm text-gray-500 mb-2">{report.location}</div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-gray-400">
                      {report._count?.prospects || 0} prospecti
                    </span>
                    <Link
                      href={`/admin/scouting/raport/${report.id}`}
                      className="text-xs text-dinamo-red hover:underline font-medium"
                    >
                      Detalii →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prospect Detail Modal */}
      {selectedProspect && (
        <ProspectDetailModal
          selectedProspect={selectedProspect}
          editingProspect={editingProspect}
          setEditingProspect={setEditingProspect}
          onClose={() => setSelectedProspect(null)}
          onSave={handleSaveProspect}
          onDelete={handleDeleteProspect}
        />
      )}

      {/* Add Prospect Modal */}
      {addingProspect && (
        <AddProspectModal
          newProspect={newProspect}
          setNewProspect={setNewProspect}
          reports={reports}
          onClose={() => setAddingProspect(false)}
          onCreate={handleCreateProspect}
        />
      )}

      {/* Add Report Modal */}
      {addingReport && (
        <AddReportModal
          reportForm={reportForm}
          setReportForm={setReportForm}
          onClose={() => setAddingReport(false)}
          onCreate={handleCreateReport}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium z-[60] ${
          toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
