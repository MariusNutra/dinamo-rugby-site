import type { Dispatch, SetStateAction } from 'react'
import type { Prospect, ScoutingReport } from '../_types'
import { STATUS_COLUMNS } from '../_constants'
import { StarRating } from './StarRating'

interface AddProspectModalProps {
  newProspect: Partial<Prospect>
  setNewProspect: Dispatch<SetStateAction<Partial<Prospect>>>
  reports: ScoutingReport[]
  onClose: () => void
  onCreate: () => void
}

export function AddProspectModal({
  newProspect,
  setNewProspect,
  reports,
  onClose,
  onCreate,
}: AddProspectModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg text-dinamo-blue">Prospect Nou</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
            <input
              type="text"
              value={newProspect.name || ''}
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
                value={newProspect.birthYear || ''}
                onChange={e => setNewProspect(prev => ({ ...prev, birthYear: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="ex: 2010"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pozitie</label>
              <input
                type="text"
                value={newProspect.position || ''}
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
              value={newProspect.currentClub || ''}
              onChange={e => setNewProspect(prev => ({ ...prev, currentClub: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="ex: CSM Bucuresti"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <StarRating
              rating={newProspect.rating ?? 0}
              onChange={r => setNewProspect(prev => ({ ...prev, rating: r }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={newProspect.status || 'identified'}
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
                value={newProspect.phone || ''}
                onChange={e => setNewProspect(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="07xx xxx xxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={newProspect.email || ''}
                onChange={e => setNewProspect(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="email@exemplu.ro"
              />
            </div>
          </div>

          {/* Link to scouting report */}
          {reports.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raport scouting (optional)</label>
              <select
                value={newProspect.scoutingReportId || ''}
                onChange={e => setNewProspect(prev => ({ ...prev, scoutingReportId: e.target.value || null }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">-- Fara raport --</option>
                {reports.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.eventName} ({new Date(r.eventDate).toLocaleDateString('ro-RO')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notite</label>
            <textarea
              value={newProspect.notes || ''}
              onChange={e => setNewProspect(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="Observatii..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCreate}
              className="flex-1 px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            >
              Adauga prospect
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Anuleaza
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
