import type { Dispatch, SetStateAction } from 'react'
import type { Badge, ChildOption } from '../_types'

interface AwardBadgeModalProps {
  badges: Badge[]
  allChildren: ChildOption[]
  awardBadgeId: string
  setAwardBadgeId: Dispatch<SetStateAction<string>>
  awardChildId: string
  setAwardChildId: Dispatch<SetStateAction<string>>
  onClose: () => void
  onAward: () => void
}

export default function AwardBadgeModal({
  badges,
  allChildren,
  awardBadgeId,
  setAwardBadgeId,
  awardChildId,
  setAwardChildId,
  onClose,
  onAward,
}: AwardBadgeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="font-heading font-bold text-xl mb-4">Acorda Badge Manual</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Badge</label>
            <select
              value={awardBadgeId}
              onChange={e => setAwardBadgeId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Selecteaza badge...</option>
              {badges.filter(b => b.active).map(b => (
                <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Sportiv</label>
            <select
              value={awardChildId}
              onChange={e => setAwardChildId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Selecteaza sportiv...</option>
              {allChildren.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.teamName ? `(${c.teamName})` : ''}</option>
              ))}
            </select>
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
            onClick={onAward}
            disabled={!awardBadgeId || !awardChildId}
            className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            Acorda Badge
          </button>
        </div>
      </div>
    </div>
  )
}
