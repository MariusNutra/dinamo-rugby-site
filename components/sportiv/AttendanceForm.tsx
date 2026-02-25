'use client'

import { useState } from 'react'

interface Child {
  id: string
  name: string
}

interface AttendanceRow {
  childId: string
  present: boolean
  notes: string
}

interface Props {
  players: Child[]
  onSave: (attendances: AttendanceRow[]) => Promise<void>
  initialAttendances?: Record<string, boolean>
}

export default function AttendanceForm({ players, onSave, initialAttendances }: Props) {
  const [rows, setRows] = useState<AttendanceRow[]>(
    players.map(c => ({
      childId: c.id,
      present: initialAttendances?.[c.id] ?? true,
      notes: '',
    }))
  )
  const [saving, setSaving] = useState(false)

  const togglePresent = (idx: number) => {
    const updated = [...rows]
    updated[idx] = { ...updated[idx], present: !updated[idx].present }
    setRows(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(rows)
    setSaving(false)
  }

  const presentCount = rows.filter(r => r.present).length

  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-500 mb-3">
        {presentCount}/{players.length} prezenti
      </div>
      {players.map((child, idx) => (
        <button
          key={child.id}
          onClick={() => togglePresent(idx)}
          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors min-h-[48px]
            ${rows[idx].present
              ? 'bg-green-50 border-green-200 hover:bg-green-100'
              : 'bg-red-50 border-red-200 hover:bg-red-100'
            }`}
        >
          <span className="font-medium text-sm">{child.name}</span>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
            rows[idx].present ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
          }`}>
            {rows[idx].present ? 'P' : 'A'}
          </span>
        </button>
      ))}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-dinamo-red text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 mt-4"
      >
        {saving ? 'Se salveaza...' : 'Salveaza prezenta'}
      </button>
    </div>
  )
}
