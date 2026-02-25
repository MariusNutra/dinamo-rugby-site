'use client'

import { useState } from 'react'
import EvalSlider from './EvalSlider'

interface Child {
  id: string
  name: string
}

interface EvalRow {
  childId: string
  physical: number
  technical: number
  tactical: number
  mental: number
  social: number
  comments: string
}

interface Props {
  players: Child[]
  period: string
  onSave: (evaluations: EvalRow[]) => Promise<void>
  onPreview?: (row: EvalRow) => void
}

const CRITERIA = [
  { key: 'physical' as const, label: 'Fizic' },
  { key: 'technical' as const, label: 'Tehnic' },
  { key: 'tactical' as const, label: 'Tactic' },
  { key: 'mental' as const, label: 'Mental' },
  { key: 'social' as const, label: 'Social' },
]

export default function EvalBulkForm({ players, period, onSave, onPreview }: Props) {
  const [rows, setRows] = useState<EvalRow[]>(
    players.map(c => ({
      childId: c.id,
      physical: 5,
      technical: 5,
      tactical: 5,
      mental: 5,
      social: 5,
      comments: '',
    }))
  )
  const [saving, setSaving] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const updateRow = (idx: number, field: keyof EvalRow, value: number | string) => {
    const updated = [...rows]
    updated[idx] = { ...updated[idx], [field]: value }
    setRows(updated)
    if (onPreview) onPreview(updated[idx])
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(rows)
    setSaving(false)
  }

  const avgScore = (row: EvalRow) => ((row.physical + row.technical + row.tactical + row.mental + row.social) / 5).toFixed(1)

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-500 mb-2">Perioada: <strong>{period}</strong> — {players.length} sportivi</div>
      {players.map((child, idx) => (
        <div key={child.id} className="border rounded-lg overflow-hidden">
          <button
            onClick={() => { setExpandedIdx(expandedIdx === idx ? null : idx); if (onPreview) onPreview(rows[idx]) }}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
          >
            <span className="font-medium text-sm">{child.name}</span>
            <span className="text-xs text-gray-500">Media: {avgScore(rows[idx])}</span>
          </button>
          {expandedIdx === idx && (
            <div className="px-3 pb-3 space-y-2 border-t bg-gray-50">
              {CRITERIA.map(c => (
                <EvalSlider
                  key={c.key}
                  label={c.label}
                  value={rows[idx][c.key]}
                  onChange={v => updateRow(idx, c.key, v)}
                />
              ))}
              <textarea
                placeholder="Comentarii (optional)"
                value={rows[idx].comments}
                onChange={e => updateRow(idx, 'comments', e.target.value)}
                className="w-full text-sm border rounded p-2 mt-1"
                rows={2}
              />
            </div>
          )}
        </div>
      ))}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-dinamo-red text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 mt-4"
      >
        {saving ? 'Se salveaza...' : `Salveaza ${players.length} evaluari`}
      </button>
    </div>
  )
}
