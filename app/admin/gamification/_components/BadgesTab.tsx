import type { Badge } from '../_types'
import { getCriteriaLabel, getCategoryLabel } from '../_helpers'

interface BadgesTabProps {
  badges: Badge[]
  badgesLoading: boolean
  onOpenAward: () => void
  onOpenNewBadge: () => void
  onEditBadge: (badge: Badge) => void
  onDeleteBadge: (id: string) => void
  onToggleActive: (badge: Badge) => void
}

export default function BadgesTab({
  badges,
  badgesLoading,
  onOpenAward,
  onOpenNewBadge,
  onEditBadge,
  onDeleteBadge,
  onToggleActive,
}: BadgesTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{badges.length} badge-uri</p>
        <div className="flex gap-2">
          <button
            onClick={onOpenAward}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            Acorda Badge
          </button>
          <button
            onClick={onOpenNewBadge}
            className="px-4 py-2 bg-dinamo-red text-white rounded-lg text-sm font-medium hover:bg-dinamo-dark transition-colors"
          >
            + Adauga Badge
          </button>
        </div>
      </div>

      {badgesLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
        </div>
      ) : badges.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🏅</p>
          <p>Nu exista badge-uri. Creeaza primul!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map(badge => (
            <div key={badge.id} className={`bg-white rounded-xl shadow-md p-6 relative transition-opacity ${!badge.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl">{badge.icon}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleActive(badge)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${badge.active ? 'bg-green-500' : 'bg-gray-300'}`}
                    title={badge.active ? 'Dezactiveaza' : 'Activeaza'}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${badge.active ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
              <h3 className="font-heading font-bold text-lg mb-1">{badge.name}</h3>
              {badge.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{badge.description}</p>
              )}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  badge.category === 'attendance' ? 'bg-blue-100 text-blue-700' :
                  badge.category === 'performance' ? 'bg-purple-100 text-purple-700' :
                  badge.category === 'special' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {getCategoryLabel(badge.category)}
                </span>
                <span className="text-xs text-gray-400">{getCriteriaLabel(badge.criteria)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{badge._count?.athletes || 0} sportivi</span>
                <div className="flex gap-2">
                  <button onClick={() => onEditBadge(badge)} className="text-dinamo-blue hover:underline">
                    Editeaza
                  </button>
                  <button onClick={() => onDeleteBadge(badge.id)} className="text-red-500 hover:underline">
                    Sterge
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
