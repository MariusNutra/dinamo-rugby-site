import type { Dispatch, SetStateAction } from 'react'
import type { ChildOption, PointRecord } from '../_types'

interface PointsTabProps {
  pointsChildSearch: string
  setPointsChildSearch: Dispatch<SetStateAction<string>>
  filteredChildren: ChildOption[]
  onSelectChild: (childId: string) => void
  pointsChildId: string
  pointsChildName: string
  pointsTotal: number
  pointsHistory: PointRecord[]
  pointsLoading: boolean
  awardAmount: string
  setAwardAmount: Dispatch<SetStateAction<string>>
  awardReason: string
  setAwardReason: Dispatch<SetStateAction<string>>
  onAwardPoints: () => void
}

export default function PointsTab({
  pointsChildSearch,
  setPointsChildSearch,
  filteredChildren,
  onSelectChild,
  pointsChildId,
  pointsChildName,
  pointsTotal,
  pointsHistory,
  pointsLoading,
  awardAmount,
  setAwardAmount,
  awardReason,
  setAwardReason,
  onAwardPoints,
}: PointsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Search and select athlete */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-heading font-bold text-lg mb-4">Cauta sportiv</h3>
        <input
          type="text"
          placeholder="Cauta dupa nume..."
          value={pointsChildSearch}
          onChange={e => setPointsChildSearch(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
        />
        {filteredChildren.length > 0 && (
          <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
            {filteredChildren.map(child => (
              <button
                key={child.id}
                onClick={() => {
                  onSelectChild(child.id)
                  setPointsChildSearch('')
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  pointsChildId === child.id ? 'bg-dinamo-light' : ''
                }`}
              >
                <span className="font-medium">{child.name}</span>
                {child.teamName && (
                  <span className="ml-2 text-xs text-gray-400">{child.teamName}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {pointsChildId && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{pointsChildName}</h4>
              <span className="text-2xl font-bold text-dinamo-red">{pointsTotal} pts</span>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3">Acorda puncte</h4>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Numar puncte"
                  value={awardAmount}
                  onChange={e => setAwardAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Motiv (ex: Comportament exemplar)"
                  value={awardReason}
                  onChange={e => setAwardReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={onAwardPoints}
                  disabled={!awardAmount || !awardReason}
                  className="w-full px-4 py-2 bg-dinamo-red text-white rounded-lg text-sm font-medium hover:bg-dinamo-dark transition-colors disabled:opacity-50"
                >
                  Acorda puncte
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Point history */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-heading font-bold text-lg mb-4">Istoric puncte</h3>
        {!pointsChildId ? (
          <p className="text-gray-400 text-sm text-center py-8">Selecteaza un sportiv pentru a vedea istoricul.</p>
        ) : pointsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-3 border-dinamo-red border-t-transparent rounded-full"></div>
          </div>
        ) : pointsHistory.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Niciun punct acordat.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pointsHistory.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{p.reason}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString('ro-RO', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`font-bold text-sm ${p.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {p.amount >= 0 ? '+' : ''}{p.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
