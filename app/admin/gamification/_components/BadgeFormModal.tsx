import type { Dispatch, SetStateAction } from 'react'
import type { Badge } from '../_types'
import { EMOJI_OPTIONS, CATEGORY_OPTIONS, CRITERIA_TYPES, SKILL_OPTIONS } from '../_constants'

interface BadgeFormModalProps {
  editingBadge: Badge | null
  onClose: () => void
  onSave: () => void
  badgeName: string
  setBadgeName: Dispatch<SetStateAction<string>>
  badgeIcon: string
  setBadgeIcon: Dispatch<SetStateAction<string>>
  badgeDescription: string
  setBadgeDescription: Dispatch<SetStateAction<string>>
  badgeCategory: string
  setBadgeCategory: Dispatch<SetStateAction<string>>
  badgeActive: boolean
  setBadgeActive: Dispatch<SetStateAction<boolean>>
  criteriaType: string
  setCriteriaType: Dispatch<SetStateAction<string>>
  criteriaDays: number
  setCriteriaDays: Dispatch<SetStateAction<number>>
  criteriaCount: number
  setCriteriaCount: Dispatch<SetStateAction<number>>
  criteriaSkill: string
  setCriteriaSkill: Dispatch<SetStateAction<string>>
  criteriaMin: number
  setCriteriaMin: Dispatch<SetStateAction<number>>
  criteriaPercent: number
  setCriteriaPercent: Dispatch<SetStateAction<number>>
}

export default function BadgeFormModal({
  editingBadge,
  onClose,
  onSave,
  badgeName,
  setBadgeName,
  badgeIcon,
  setBadgeIcon,
  badgeDescription,
  setBadgeDescription,
  badgeCategory,
  setBadgeCategory,
  badgeActive,
  setBadgeActive,
  criteriaType,
  setCriteriaType,
  criteriaDays,
  setCriteriaDays,
  criteriaCount,
  setCriteriaCount,
  criteriaSkill,
  setCriteriaSkill,
  criteriaMin,
  setCriteriaMin,
  criteriaPercent,
  setCriteriaPercent,
}: BadgeFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="font-heading font-bold text-xl mb-4">
          {editingBadge ? 'Editeaza Badge' : 'Badge Nou'}
        </h2>

        <div className="space-y-4">
          {/* Icon picker */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Pictograma</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setBadgeIcon(emoji)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    badgeIcon === emoji
                      ? 'bg-dinamo-red/10 ring-2 ring-dinamo-red scale-110'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Nume</label>
            <input
              type="text"
              value={badgeName}
              onChange={e => setBadgeName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="ex: Campionul Prezentei"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Descriere</label>
            <textarea
              value={badgeDescription}
              onChange={e => setBadgeDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={2}
              placeholder="Descrierea badge-ului..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Categorie</label>
            <select
              value={badgeCategory}
              onChange={e => setBadgeCategory(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Criteria */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Criteriu</label>
            <select
              value={criteriaType}
              onChange={e => setCriteriaType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
            >
              {CRITERIA_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {criteriaType === 'attendance_streak' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Zile consecutive:</label>
                <input
                  type="number"
                  min={1}
                  value={criteriaDays}
                  onChange={e => setCriteriaDays(parseInt(e.target.value) || 1)}
                  className="w-20 border rounded-lg px-2 py-1 text-sm"
                />
              </div>
            )}

            {criteriaType === 'attendance_total' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Numar prezente:</label>
                <input
                  type="number"
                  min={1}
                  value={criteriaCount}
                  onChange={e => setCriteriaCount(parseInt(e.target.value) || 1)}
                  className="w-20 border rounded-lg px-2 py-1 text-sm"
                />
              </div>
            )}

            {criteriaType === 'evaluation_score' && (
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm text-gray-600">Skill:</label>
                <select
                  value={criteriaSkill}
                  onChange={e => setCriteriaSkill(e.target.value)}
                  className="border rounded-lg px-2 py-1 text-sm"
                >
                  {SKILL_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <label className="text-sm text-gray-600">Min:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={criteriaMin}
                  onChange={e => setCriteriaMin(parseInt(e.target.value) || 1)}
                  className="w-16 border rounded-lg px-2 py-1 text-sm"
                />
              </div>
            )}

            {criteriaType === 'evaluation_improvement' && (
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm text-gray-600">Skill:</label>
                <select
                  value={criteriaSkill}
                  onChange={e => setCriteriaSkill(e.target.value)}
                  className="border rounded-lg px-2 py-1 text-sm"
                >
                  {SKILL_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <label className="text-sm text-gray-600">Imbunatatire %:</label>
                <input
                  type="number"
                  min={1}
                  value={criteriaPercent}
                  onChange={e => setCriteriaPercent(parseInt(e.target.value) || 1)}
                  className="w-16 border rounded-lg px-2 py-1 text-sm"
                />
              </div>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Activ</label>
            <button
              onClick={() => setBadgeActive(!badgeActive)}
              className={`w-12 h-6 rounded-full transition-colors relative ${badgeActive ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${badgeActive ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Anuleaza
          </button>
          <button
            onClick={onSave}
            disabled={!badgeName}
            className="flex-1 px-4 py-2 bg-dinamo-red text-white rounded-lg text-sm font-medium hover:bg-dinamo-dark transition-colors disabled:opacity-50"
          >
            {editingBadge ? 'Salveaza' : 'Creeaza'}
          </button>
        </div>
      </div>
    </div>
  )
}
