'use client'

import { TYPE_LABELS, TYPE_COLORS } from '../_constants'
import type { Competition } from '../_types'

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface CompetitionCardProps {
  comp: Competition
  expanded: boolean
  expandedData: Competition | null
  recalculating: boolean
  saving: boolean
  showTeamInput: boolean
  newTeamName: string
  onNewTeamNameChange: (value: string) => void
  onToggleExpand: () => void
  onStartEdit: () => void
  onDelete: () => void
  onShowTeamInput: () => void
  onOpenMatchModal: () => void
  onRecalculate: () => void
  onAddTeam: () => void
  onCancelTeamInput: () => void
  onDeleteTeam: (teamId: string) => void
}

export default function CompetitionCard({
  comp,
  expanded,
  expandedData,
  recalculating,
  saving,
  showTeamInput,
  newTeamName,
  onNewTeamNameChange,
  onToggleExpand,
  onStartEdit,
  onDelete,
  onShowTeamInput,
  onOpenMatchModal,
  onRecalculate,
  onAddTeam,
  onCancelTeamInput,
  onDeleteTeam,
}: CompetitionCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Card header */}
      <div
        className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-heading font-bold text-lg">{comp.name}</h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[comp.type] || 'bg-gray-100 text-gray-800'}`}>
                {TYPE_LABELS[comp.type] || comp.type}
              </span>
              {!comp.active && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-500">
                  Inactiva
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {comp.season && (
                <span>Sezon: <strong className="text-gray-700">{comp.season}</strong></span>
              )}
              {comp.category && (
                <span>Categorie: <strong className="text-gray-700">{comp.category}</strong></span>
              )}
              <span>
                {formatDate(comp.startDate)}
                {comp.endDate && ` — ${formatDate(comp.endDate)}`}
              </span>
              <span>{comp.teamCount} echipe</span>
              <span>{comp.matchCount} meciuri</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={(e) => { e.stopPropagation(); onStartEdit() }}
              className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Editare
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Sterge
            </button>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && expandedData && (
        <div className="border-t border-gray-100 p-5 bg-gray-50/50">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={onShowTeamInput}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              + Adauga echipa
            </button>
            <button
              onClick={onOpenMatchModal}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              + Adauga meci
            </button>
            <button
              onClick={onRecalculate}
              disabled={recalculating}
              className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
            >
              {recalculating ? 'Se recalculeaza...' : 'Recalculeaza clasament'}
            </button>
          </div>

          {/* Add team inline */}
          {showTeamInput && (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Numele echipei"
                value={newTeamName}
                onChange={e => onNewTeamNameChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onAddTeam()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none"
                autoFocus
              />
              <button
                onClick={onAddTeam}
                disabled={saving}
                className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
              >
                Adauga
              </button>
              <button
                onClick={onCancelTeamInput}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Anuleaza
              </button>
            </div>
          )}

          {/* Standings table */}
          {expandedData.teams.length > 0 && (
            <div className="mb-6">
              <h4 className="font-heading font-bold text-sm uppercase text-gray-500 mb-3">Clasament</h4>
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-dinamo-blue text-white text-xs uppercase">
                        <th className="px-3 py-2.5 text-center w-10">#</th>
                        <th className="px-3 py-2.5 text-left">Echipa</th>
                        <th className="px-3 py-2.5 text-center w-10">MJ</th>
                        <th className="px-3 py-2.5 text-center w-10">V</th>
                        <th className="px-3 py-2.5 text-center w-10">E</th>
                        <th className="px-3 py-2.5 text-center w-10">I</th>
                        <th className="px-3 py-2.5 text-center w-12">GM</th>
                        <th className="px-3 py-2.5 text-center w-12">GP</th>
                        <th className="px-3 py-2.5 text-center w-12">GD</th>
                        <th className="px-3 py-2.5 text-center w-12 font-bold">Pts</th>
                        <th className="px-3 py-2.5 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {expandedData.teams.map((team, idx) => (
                        <tr
                          key={team.id}
                          className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${idx === 0 ? 'font-semibold' : ''}`}
                        >
                          <td className="px-3 py-2.5 text-center text-gray-500">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-medium">{team.teamName}</td>
                          <td className="px-3 py-2.5 text-center">{team.played}</td>
                          <td className="px-3 py-2.5 text-center text-green-700">{team.won}</td>
                          <td className="px-3 py-2.5 text-center text-gray-500">{team.drawn}</td>
                          <td className="px-3 py-2.5 text-center text-red-600">{team.lost}</td>
                          <td className="px-3 py-2.5 text-center">{team.goalsFor}</td>
                          <td className="px-3 py-2.5 text-center">{team.goalsAgainst}</td>
                          <td className="px-3 py-2.5 text-center">
                            {team.goalsFor - team.goalsAgainst > 0 ? '+' : ''}{team.goalsFor - team.goalsAgainst}
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-dinamo-red">{team.points}</td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => onDeleteTeam(team.id)}
                              className="text-red-400 hover:text-red-600 text-xs"
                              title="Sterge echipa"
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Matches list */}
          {expandedData.matches && expandedData.matches.length > 0 && (
            <div>
              <h4 className="font-heading font-bold text-sm uppercase text-gray-500 mb-3">Meciuri</h4>
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-xs text-gray-500 uppercase">
                        <th className="px-3 py-2 text-left">Data</th>
                        <th className="px-3 py-2 text-left">Runda</th>
                        <th className="px-3 py-2 text-left">Meci</th>
                        <th className="px-3 py-2 text-center">Scor</th>
                        <th className="px-3 py-2 text-left">Locatie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expandedData.matches.map(match => (
                        <tr key={match.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                            {new Date(match.date).toLocaleDateString('ro-RO', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </td>
                          <td className="px-3 py-2.5 text-gray-500 text-xs">
                            {match.round || '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-medium">{match.homeTeam}</span>
                            <span className="mx-1.5 text-gray-400">vs</span>
                            <span className="font-medium">{match.awayTeam}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {match.homeScore !== null ? (
                              <span className="font-bold">{match.homeScore} - {match.awayScore}</span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-gray-500 text-xs">
                            {match.location || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {expandedData.teams.length === 0 && (!expandedData.matches || expandedData.matches.length === 0) && (
            <p className="text-gray-400 text-sm text-center py-6">
              Aceasta competitie nu are inca echipe sau meciuri.
            </p>
          )}
        </div>
      )}

      {/* Loading state for expanded */}
      {expanded && !expandedData && (
        <div className="border-t border-gray-100 p-8 flex justify-center">
          <div className="animate-spin w-6 h-6 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  )
}
