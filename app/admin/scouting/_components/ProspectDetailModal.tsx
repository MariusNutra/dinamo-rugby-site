import type { Dispatch, SetStateAction } from 'react'
import type { Prospect } from '../_types'
import { STATUS_COLUMNS, STATUS_BG_COLORS } from '../_constants'
import { StarRating } from './StarRating'

interface ProspectDetailModalProps {
  selectedProspect: Prospect
  editingProspect: Partial<Prospect>
  setEditingProspect: Dispatch<SetStateAction<Partial<Prospect>>>
  onClose: () => void
  onSave: () => void
  onDelete: (id: string) => void
}

export function ProspectDetailModal({
  selectedProspect,
  editingProspect,
  setEditingProspect,
  onClose,
  onSave,
  onDelete,
}: ProspectDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg text-dinamo-blue">Detalii Prospect</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume</label>
            <input
              type="text"
              value={editingProspect.name || ''}
              onChange={e => setEditingProspect(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Birth Year & Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">An nastere</label>
              <input
                type="number"
                value={editingProspect.birthYear || ''}
                onChange={e => setEditingProspect(prev => ({ ...prev, birthYear: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="ex: 2010"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pozitie</label>
              <input
                type="text"
                value={editingProspect.position || ''}
                onChange={e => setEditingProspect(prev => ({ ...prev, position: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="ex: Centru"
              />
            </div>
          </div>

          {/* Current Club */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Club curent</label>
            <input
              type="text"
              value={editingProspect.currentClub || ''}
              onChange={e => setEditingProspect(prev => ({ ...prev, currentClub: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="ex: CSM Bucuresti"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <StarRating
              rating={editingProspect.rating ?? 0}
              onChange={r => setEditingProspect(prev => ({ ...prev, rating: r }))}
            />
          </div>

          {/* Status */}
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

          {/* Contact Info */}
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

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notite</label>
            <textarea
              value={editingProspect.notes || ''}
              onChange={e => setEditingProspect(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="Observatii despre prospect..."
            />
          </div>

          {/* Report link */}
          {selectedProspect.scoutingReport && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
              Raport: {selectedProspect.scoutingReport.eventName} ({new Date(selectedProspect.scoutingReport.eventDate).toLocaleDateString('ro-RO')})
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            >
              Salveaza
            </button>
            <button
              onClick={() => onDelete(selectedProspect.id)}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
            >
              Sterge
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Inchide
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
