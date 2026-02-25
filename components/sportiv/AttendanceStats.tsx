'use client'

interface Props {
  total: number
  present: number
}

export default function AttendanceStats({ total, present }: Props) {
  const percent = total > 0 ? Math.round((present / total) * 100) : 0
  const absent = total - present

  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Rata prezenta</span>
          <span className="font-bold">{percent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${percent >= 80 ? 'bg-green-500' : percent >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="bg-gray-50 rounded p-2">
          <div className="font-bold text-lg">{total}</div>
          <div className="text-gray-500 text-xs">Total</div>
        </div>
        <div className="bg-green-50 rounded p-2">
          <div className="font-bold text-lg text-green-700">{present}</div>
          <div className="text-gray-500 text-xs">Prezent</div>
        </div>
        <div className="bg-red-50 rounded p-2">
          <div className="font-bold text-lg text-red-700">{absent}</div>
          <div className="text-gray-500 text-xs">Absent</div>
        </div>
      </div>
    </div>
  )
}
