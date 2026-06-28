import type { Dispatch, SetStateAction } from 'react'
import type { LeaderboardEntry, Team } from '../_types'

interface LeaderboardTabProps {
  leaderboard: LeaderboardEntry[]
  leaderboardLoading: boolean
  leaderboardTeam: string
  setLeaderboardTeam: Dispatch<SetStateAction<string>>
  teams: Team[]
}

export default function LeaderboardTab({
  leaderboard,
  leaderboardLoading,
  leaderboardTeam,
  setLeaderboardTeam,
  teams,
}: LeaderboardTabProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium text-gray-700">Filtreaza echipa:</label>
        <select
          value={leaderboardTeam}
          onChange={e => setLeaderboardTeam(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Toate echipele</option>
          {teams.map(t => (
            <option key={t.id} value={String(t.id)}>{t.grupa}</option>
          ))}
        </select>
      </div>

      {leaderboardLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🏆</p>
          <p>Niciun sportiv in clasament. Acorda puncte sau badge-uri!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium w-12">#</th>
                <th className="text-left p-3 font-medium">Sportiv</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Echipa</th>
                <th className="text-center p-3 font-medium">Puncte</th>
                <th className="text-center p-3 font-medium">Badge-uri</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => (
                <tr key={entry.childId} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (
                      <span className="text-gray-400 font-medium">{idx + 1}</span>
                    )}
                  </td>
                  <td className="p-3 font-medium">{entry.name}</td>
                  <td className="p-3 text-gray-600 hidden sm:table-cell">
                    {entry.teamName && (
                      <span className="text-xs bg-dinamo-blue/10 text-dinamo-blue px-2 py-0.5 rounded-full">
                        {entry.teamName}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-bold text-dinamo-red">{entry.totalPoints}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-medium">{entry.badgeCount}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
