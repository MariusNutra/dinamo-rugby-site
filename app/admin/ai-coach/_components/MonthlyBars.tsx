// ── Monthly Attendance Bars ─────────────────────────────────────────────

export function MonthlyBars({ data }: { data: { month: string; rate: number; total: number; present: number }[] }) {
  const maxHeight = 120

  return (
    <div className="flex items-end justify-between gap-2 h-[160px] px-2">
      {data.map((d, i) => {
        const barHeight = d.total > 0 ? (d.rate / 100) * maxHeight : 0
        const color = d.rate >= 80 ? 'bg-green-500' : d.rate >= 60 ? 'bg-yellow-500' : d.rate > 0 ? 'bg-red-500' : 'bg-gray-200'

        return (
          <div key={i} className="flex flex-col items-center flex-1">
            <span className="text-xs font-semibold text-gray-700 mb-1">
              {d.total > 0 ? `${d.rate}%` : '-'}
            </span>
            <div className="w-full flex items-end justify-center" style={{ height: maxHeight }}>
              <div
                className={`w-full max-w-[36px] rounded-t-md transition-all duration-500 ${color}`}
                style={{ height: Math.max(barHeight, 4) }}
                title={`${d.present}/${d.total} prezente`}
              />
            </div>
            <span className="text-[10px] text-gray-500 mt-1 text-center leading-tight">
              {d.month}
            </span>
          </div>
        )
      })}
    </div>
  )
}
