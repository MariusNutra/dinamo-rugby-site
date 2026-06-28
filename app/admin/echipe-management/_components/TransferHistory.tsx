import type { TransferInfo } from '../_types'
import { formatDate, formatDateRelative } from '../_utils'

interface TransferHistoryProps {
  loadingHistory: boolean
  transfers: TransferInfo[]
}

export default function TransferHistory({ loadingHistory, transfers }: TransferHistoryProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {loadingHistory ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full" />
        </div>
      ) : transfers.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <p className="text-gray-400 text-sm">Niciun transfer inregistrat</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Data</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Sportiv</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">De la</th>
                <th className="text-center px-2 py-3 font-semibold text-gray-600"></th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">La</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Motiv</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t, idx) => (
                <tr key={t.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-50`}>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-gray-900">{formatDate(t.createdAt)}</span>
                    <span className="text-gray-400 text-xs ml-1">({formatDateRelative(t.createdAt)})</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-900">{t.childName}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-block px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">
                      {t.fromTeamGrupa}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <svg className="w-4 h-4 text-gray-400 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-block px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                      {t.toTeamGrupa}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 max-w-[200px] truncate">
                    {t.reason || <span className="text-gray-300">—</span>}
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
