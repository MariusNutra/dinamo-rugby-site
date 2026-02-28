'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getCsrfToken } from '@/lib/csrf-client'
import Link from 'next/link'

interface ScoutingReport {
  id: string
  eventName: string
  eventDate: string
  location: string | null
  notes: string | null
  createdBy: string | null
  createdAt: string
  prospects: Prospect[]
}

interface Prospect {
  id: string
  name: string
  birthYear: number | null
  position: string | null
  currentClub: string | null
  notes: string | null
  rating: number
  status: string
  phone: string | null
  email: string | null
  scoutingReportId: string | null
  createdAt: string
}

const STATUS_COLUMNS = [
  { key: 'identified', label: 'Identificat' },
  { key: 'contacted', label: 'Contactat' },
  { key: 'trial', label: 'Trial' },
  { key: 'enrolled', label: 'Inscris' },
  { key: 'rejected', label: 'Respins' },
] as const

const STATUS_BG_COLORS: Record<string, string> = {
  identified: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  trial: 'bg-amber-100 text-amber-700',
  enrolled: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const STATUS_BORDER_COLORS: Record<string, string> = {
  identified: 'border-l-gray-400',
  contacted: 'border-l-blue-500',
  trial: 'border-l-amber-500',
  enrolled: 'border-l-green-500',
  rejected: 'border-l-red-500',
}

function StarRating({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star === rating ? 0 : star)}
          className={`text-lg leading-none ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'} ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function ReportDetailPage() {
  const params = useParams()
  const reportId = params.id as string

  const [report, setReport] = useState<ScoutingReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  // Editing report
  const [editingReport, setEditingReport] = useState(false)
  const [reportForm, setReportForm] = useState({
    eventName: '', eventDate: '', location: '', notes: '',
  })

  // Add prospect
  const [addingProspect, setAddingProspect] = useState(false)
  const [newProspect, setNewProspect] = useState({
    name: '', birthYear: '' as string | number, position: '', currentClub: '',
    notes: '', rating: 0, status: 'identified', phone: '', email: '',
  })

  // Prospect detail modal
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [editingProspect, setEditingProspect] = useState<Partial<Prospect>>({})

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadReport = useCallback(() => {
    fetch(`/api/admin/scouting/${reportId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setReport(null)
        } else {
          setReport(data)
          setReportForm({
            eventName: data.eventName || '',
            eventDate: data.eventDate ? data.eventDate.split('T')[0] : '',
            location: data.location || '',
            notes: data.notes || '',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [reportId])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  // --- Report edit ---

  const handleSaveReport = async () => {
    if (!reportForm.eventName || !reportForm.eventDate) {
      showToast('Numele si data sunt obligatorii', 'err')
      return
    }
    const res = await fetch(`/api/admin/scouting/${reportId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
      body: JSON.stringify(reportForm),
    })
    if (res.ok) {
      showToast('Raport actualizat')
      setEditingReport(false)
      loadReport()
    } else {
      showToast('Eroare la salvare', 'err')
    }
  }

  // --- Prospect CRUD ---

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
        birthYear: newProspect.birthYear ? Number(newProspect.birthYear) : null,
        position: newProspect.position || null,
        currentClub: newProspect.currentClub || null,
        notes: newProspect.notes || null,
        rating: newProspect.rating,
        status: newProspect.status,
        phone: newProspect.phone || null,
        email: newProspect.email || null,
        scoutingReportId: reportId,
      }),
    })
    if (res.ok) {
      showToast('Prospect adaugat')
      setAddingProspect(false)
      setNewProspect({
        name: '', birthYear: '', position: '', currentClub: '',
        notes: '', rating: 0, status: 'identified', phone: '', email: '',
      })
      loadReport()
    } else {
      showToast('Eroare la creare', 'err')
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
      loadReport()
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
      loadReport()
    } else {
      showToast('Eroare la stergere', 'err')
    }
  }

  const handleStatusChange = async (prospectId: string, newStatus: string) => {
    const res = await fetch(`/api/admin/scouting/prospects/${prospectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      showToast('Status actualizat')
      loadReport()
    } else {
      showToast('Eroare', 'err')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Raportul nu a fost gasit.</p>
        <Link href="/admin/scouting" className="text-dinamo-red hover:underline">
          &larr; Inapoi la scouting
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Back link */}
      <Link href="/admin/scouting" className="text-sm text-dinamo-red hover:underline inline-block mb-4">
        &larr; Inapoi la scouting
      </Link>

      {/* Report Info */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        {editingReport ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numele evenimentului *</label>
              <input
                type="text"
                value={reportForm.eventName}
                onChange={e => setReportForm(prev => ({ ...prev, eventName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                <input
                  type="date"
                  value={reportForm.eventDate}
                  onChange={e => setReportForm(prev => ({ ...prev, eventDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
                <input
                  type="text"
                  value={reportForm.location}
                  onChange={e => setReportForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notite</label>
              <textarea
                value={reportForm.notes}
                onChange={e => setReportForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveReport}
                className="px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Salveaza
              </button>
              <button
                onClick={() => setEditingReport(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Anuleaza
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-heading text-2xl font-bold text-dinamo-blue">{report.eventName}</h1>
                <div className="text-sm text-gray-600 mt-1">
                  {new Date(report.eventDate).toLocaleDateString('ro-RO', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                  {report.location && ` — ${report.location}`}
                </div>
              </div>
              <button
                onClick={() => setEditingReport(true)}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Editeaza
              </button>
            </div>
            {report.notes && (
              <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-lg p-3">{report.notes}</p>
            )}
            {report.createdBy && (
              <div className="text-xs text-gray-400 mt-2">Creat de: {report.createdBy}</div>
            )}
          </div>
        )}
      </div>

      {/* Prospects Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-lg text-dinamo-blue">
          Prospecti ({report.prospects?.length || 0})
        </h2>
        <button
          onClick={() => setAddingProspect(true)}
          className="px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
        >
          + Adauga prospect
        </button>
      </div>

      {(!report.prospects || report.prospects.length === 0) ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">Niciun prospect in acest raport</p>
          <button
            onClick={() => setAddingProspect(true)}
            className="mt-3 text-sm text-dinamo-red hover:underline"
          >
            Adauga primul prospect
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {report.prospects.map(prospect => (
            <div
              key={prospect.id}
              onClick={() => openProspectDetail(prospect)}
              className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${STATUS_BORDER_COLORS[prospect.status]} cursor-pointer hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-medium text-gray-900">{prospect.name}</span>
                    {prospect.birthYear && (
                      <span className="text-sm text-gray-500 ml-2">({prospect.birthYear})</span>
                    )}
                  </div>
                  {prospect.position && (
                    <span className="text-sm text-gray-500">{prospect.position}</span>
                  )}
                  {prospect.currentClub && (
                    <span className="text-sm text-gray-400">{prospect.currentClub}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StarRating rating={prospect.rating} readonly />
                  <select
                    value={prospect.status}
                    onChange={e => {
                      e.stopPropagation()
                      handleStatusChange(prospect.id, e.target.value)
                    }}
                    onClick={e => e.stopPropagation()}
                    className={`text-xs px-2 py-1 rounded-md border-0 ${STATUS_BG_COLORS[prospect.status]}`}
                  >
                    {STATUS_COLUMNS.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Prospect Modal */}
      {addingProspect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAddingProspect(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg text-dinamo-blue">Prospect Nou</h2>
              <button onClick={() => setAddingProspect(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
                <input
                  type="text"
                  value={newProspect.name}
                  onChange={e => setNewProspect(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Numele prospectului"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">An nastere</label>
                  <input
                    type="number"
                    value={newProspect.birthYear}
                    onChange={e => setNewProspect(prev => ({ ...prev, birthYear: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="ex: 2010"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pozitie</label>
                  <input
                    type="text"
                    value={newProspect.position}
                    onChange={e => setNewProspect(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="ex: Centru"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Club curent</label>
                <input
                  type="text"
                  value={newProspect.currentClub}
                  onChange={e => setNewProspect(prev => ({ ...prev, currentClub: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="ex: CSM Bucuresti"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <StarRating
                  rating={newProspect.rating}
                  onChange={r => setNewProspect(prev => ({ ...prev, rating: r }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newProspect.status}
                  onChange={e => setNewProspect(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {STATUS_COLUMNS.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={newProspect.phone}
                    onChange={e => setNewProspect(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="07xx xxx xxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newProspect.email}
                    onChange={e => setNewProspect(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="email@exemplu.ro"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notite</label>
                <textarea
                  value={newProspect.notes}
                  onChange={e => setNewProspect(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Observatii..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateProspect}
                  className="flex-1 px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                >
                  Adauga prospect
                </button>
                <button
                  onClick={() => setAddingProspect(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Anuleaza
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prospect Detail Modal */}
      {selectedProspect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProspect(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg text-dinamo-blue">Detalii Prospect</h2>
              <button onClick={() => setSelectedProspect(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nume</label>
                <input
                  type="text"
                  value={editingProspect.name || ''}
                  onChange={e => setEditingProspect(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">An nastere</label>
                  <input
                    type="number"
                    value={editingProspect.birthYear || ''}
                    onChange={e => setEditingProspect(prev => ({ ...prev, birthYear: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pozitie</label>
                  <input
                    type="text"
                    value={editingProspect.position || ''}
                    onChange={e => setEditingProspect(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Club curent</label>
                <input
                  type="text"
                  value={editingProspect.currentClub || ''}
                  onChange={e => setEditingProspect(prev => ({ ...prev, currentClub: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <StarRating
                  rating={editingProspect.rating ?? 0}
                  onChange={r => setEditingProspect(prev => ({ ...prev, rating: r }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editingProspect.status || 'identified'}
                  onChange={e => setEditingProspect(prev => ({ ...prev, status: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${STATUS_BG_COLORS[editingProspect.status || 'identified']}`}
                >
                  {STATUS_COLUMNS.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Contact</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={editingProspect.phone || ''}
                      onChange={e => setEditingProspect(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="07xx xxx xxx"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={editingProspect.email || ''}
                      onChange={e => setEditingProspect(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="email@exemplu.ro"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notite</label>
                <textarea
                  value={editingProspect.notes || ''}
                  onChange={e => setEditingProspect(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveProspect}
                  className="flex-1 px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                >
                  Salveaza
                </button>
                <button
                  onClick={() => handleDeleteProspect(selectedProspect.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                >
                  Sterge
                </button>
                <button
                  onClick={() => setSelectedProspect(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Inchide
                </button>
              </div>
            </div>
          </div>
        </div>
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
