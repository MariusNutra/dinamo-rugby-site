'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { MatchFormState } from '../_types'

interface AddMatchModalProps {
  matchForm: MatchFormState
  setMatchForm: Dispatch<SetStateAction<MatchFormState>>
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  saving: boolean
}

export default function AddMatchModal({
  matchForm,
  setMatchForm,
  onSubmit,
  onClose,
  saving,
}: AddMatchModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="font-heading font-bold text-xl mb-5">Adauga meci</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                <input
                  type="text"
                  value={matchForm.category}
                  onChange={e => setMatchForm({ ...matchForm, category: e.target.value })}
                  placeholder="Ex: U14"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Runda / Etapa</label>
                <input
                  type="text"
                  value={matchForm.round}
                  onChange={e => setMatchForm({ ...matchForm, round: e.target.value })}
                  placeholder="Ex: Etapa 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data si ora *</label>
              <input
                type="datetime-local"
                required
                value={matchForm.date}
                onChange={e => setMatchForm({ ...matchForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
              <input
                type="text"
                value={matchForm.location}
                onChange={e => setMatchForm({ ...matchForm, location: e.target.value })}
                placeholder="Ex: Stadionul Dinamo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Echipa gazda *</label>
                <input
                  type="text"
                  required
                  value={matchForm.homeTeam}
                  onChange={e => setMatchForm({ ...matchForm, homeTeam: e.target.value })}
                  placeholder="Echipa gazda"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Echipa oaspete *</label>
                <input
                  type="text"
                  required
                  value={matchForm.awayTeam}
                  onChange={e => setMatchForm({ ...matchForm, awayTeam: e.target.value })}
                  placeholder="Echipa oaspete"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scor gazda</label>
                <input
                  type="number"
                  min="0"
                  value={matchForm.homeScore}
                  onChange={e => setMatchForm({ ...matchForm, homeScore: e.target.value })}
                  placeholder="—"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scor oaspete</label>
                <input
                  type="number"
                  min="0"
                  value={matchForm.awayScore}
                  onChange={e => setMatchForm({ ...matchForm, awayScore: e.target.value })}
                  placeholder="—"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                value={matchForm.notes}
                onChange={e => setMatchForm({ ...matchForm, notes: e.target.value })}
                rows={2}
                placeholder="Observatii..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-dinamo-red text-white px-6 py-2.5 rounded-lg font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
              >
                {saving ? 'Se salveaza...' : 'Adauga meciul'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                Anuleaza
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
