'use client'

import { useState, useMemo } from 'react'

interface AttendanceRecord {
  date: string
  present: boolean
  type?: string
}

interface Props {
  attendances: AttendanceRecord[]
  month?: string // YYYY-MM
  onMonthChange?: (month: string) => void
}

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export default function AttendanceCalendar({ attendances, month, onMonthChange }: Props) {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  const [year, m] = currentMonth.split('-').map(Number)

  const attendanceMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    attendances.forEach(a => {
      const d = new Date(a.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      map[key] = a.present
    })
    return map
  }, [attendances])

  const firstDay = new Date(year, m - 1, 1)
  const daysInMonth = new Date(year, m, 0).getDate()
  // Monday=0, Sunday=6
  let startDay = firstDay.getDay() - 1
  if (startDay < 0) startDay = 6

  const cells: ({ day: number; status: 'present' | 'absent' | 'none' } | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const status = key in attendanceMap ? (attendanceMap[key] ? 'present' : 'absent') : 'none'
    cells.push({ day: d, status })
  }

  const changeMonth = (delta: number) => {
    const newDate = new Date(year, m - 1 + delta, 1)
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
    setCurrentMonth(newMonth)
    onMonthChange?.(newMonth)
  }

  const monthName = new Date(year, m - 1).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded text-lg">&larr;</button>
        <span className="font-medium capitalize">{monthName}</span>
        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded text-lg">&rarr;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {DAYS.map((d, i) => (
          <div key={i} className="font-bold text-gray-500 py-1">{d}</div>
        ))}
        {cells.map((cell, i) => (
          <div key={i} className={`aspect-square flex items-center justify-center rounded text-xs font-medium
            ${!cell ? '' : cell.status === 'present' ? 'bg-green-100 text-green-800' : cell.status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-gray-50 text-gray-400'}`}>
            {cell?.day || ''}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-500 justify-center">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 rounded"></span> Prezent</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded"></span> Absent</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-50 rounded border"></span> Fara date</span>
      </div>
    </div>
  )
}
