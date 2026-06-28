// ── Attendance Progress Bar ─────────────────────────────────────────────

export function AttendanceGauge({ rate, label }: { rate: number; label?: string }) {
  const color = rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  const textColor = rate >= 80 ? 'text-green-700' : rate >= 60 ? 'text-yellow-700' : 'text-red-700'

  return (
    <div>
      {label && <p className="text-sm text-gray-600 mb-1">{label}</p>}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </div>
        <span className={`font-bold text-lg min-w-[50px] text-right ${textColor}`}>
          {rate}%
        </span>
      </div>
    </div>
  )
}
