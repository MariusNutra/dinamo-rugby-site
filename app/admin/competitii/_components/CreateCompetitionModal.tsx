'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { CompetitionForm } from '../_types'

interface CreateCompetitionModalProps {
  form: CompetitionForm
  setForm: Dispatch<SetStateAction<CompetitionForm>>
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  onCancel: () => void
  saving: boolean
}

export default function CreateCompetitionModal({
  form,
  setForm,
  onSubmit,
  onClose,
  onCancel,
  saving,
}: CreateCompetitionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="font-heading font-bold text-xl mb-5">Competitie noua</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Campionatul National U14"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                >
                  <option value="turneu">Turneu</option>
                  <option value="liga">Liga</option>
                  <option value="cupa">Cupa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex: U14"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sezon</label>
              <input
                type="text"
                value={form.season}
                onChange={e => setForm({ ...form, season: e.target.value })}
                placeholder="Ex: 2025-2026"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data inceput</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data sfarsit</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Descriere optionala..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Echipe (cate una pe linie)</label>
              <textarea
                value={form.teamsText}
                onChange={e => setForm({ ...form, teamsText: e.target.value })}
                rows={5}
                placeholder={"Dinamo Bucuresti\nSteaua Bucuresti\nCSM Timisoara\n..."}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none font-mono"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-dinamo-red text-white px-6 py-2.5 rounded-lg font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
              >
                {saving ? 'Se salveaza...' : 'Creeaza competitia'}
              </button>
              <button
                type="button"
                onClick={onCancel}
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
