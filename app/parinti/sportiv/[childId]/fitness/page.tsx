'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface FitnessEntry {
  id: string
  date: string
  heartRateAvg: number | null
  heartRateMax: number | null
  distance: number | null
  sprintCount: number | null
  calories: number | null
  sleepHours: number | null
  source: string
  notes: string | null
}

interface Summary {
  avgHeartRate: number | null
  totalDistance: number
  avgSleep: number | null
  totalCalories: number
  totalSprints: number
  sessionCount: number
}

export default function ParinteFitnessPage() {
  const { childId } = useParams<{ childId: string }>()
  const router = useRouter()
  const [entries, setEntries] = useState<FitnessEntry[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [childName, setChildName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch child info
    fetch(`/api/parinti/sportiv/${childId}`)
      .then(r => {
        if (r.status === 401) { router.push('/parinti'); return null }
        return r.json()
      })
      .then(data => {
        if (data && !data.error) setChildName(data.name)
      })
      .catch(() => {})

    // Fetch fitness data
    fetch(`/api/parinti/fitness/${childId}`)
      .then(r => {
        if (r.status === 401) { router.push('/parinti'); return null }
        return r.json()
      })
      .then(data => {
        if (data && !data.error) {
          if (Array.isArray(data.entries)) setEntries(data.entries)
          if (data.summary) setSummary(data.summary)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [childId, router])

  // SVG Heart Rate Chart
  const chartData = [...entries]
    .filter(e => e.heartRateAvg != null)
    .reverse()
    .slice(-30)

  const renderChart = () => {
    if (chartData.length < 2) {
      return <p className="text-gray-400 text-sm text-center py-8">Sunt necesare cel putin 2 inregistrari cu date HR pentru grafic.</p>
    }

    const W = 600, H = 200, PAD_L = 45, PAD_R = 15, PAD_T = 20, PAD_B = 40
    const plotW = W - PAD_L - PAD_R
    const plotH = H - PAD_T - PAD_B

    const values = chartData.map(d => d.heartRateAvg!)
    const minVal = Math.floor(Math.min(...values) / 10) * 10
    const maxVal = Math.ceil(Math.max(...values) / 10) * 10
    const range = maxVal - minVal || 10

    const xStep = plotW / (chartData.length - 1)
    const points = chartData.map((d, i) => ({
      x: PAD_L + i * xStep,
      y: PAD_T + plotH - ((d.heartRateAvg! - minVal) / range) * plotH,
      date: d.date,
      val: d.heartRateAvg!,
    }))

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

    const gridLines = []
    for (let i = 0; i <= 4; i++) {
      const y = PAD_T + (plotH / 4) * i
      const val = Math.round(maxVal - (range / 4) * i)
      gridLines.push({ y, val })
    }

    const labelStep = Math.max(1, Math.floor(chartData.length / 6))
    const xLabels = points.filter((_, i) => i % labelStep === 0 || i === points.length - 1)

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={g.y} x2={W - PAD_R} y2={g.y} stroke="#e5e7eb" strokeWidth="1" />
            <text x={PAD_L - 5} y={g.y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{g.val}</text>
          </g>
        ))}
        <path d={linePath} fill="none" stroke="#dc2626" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#dc2626" />
        ))}
        {xLabels.map((p, i) => {
          const d = new Date(p.date)
          const label = `${d.getDate()}/${d.getMonth() + 1}`
          return (
            <text key={i} x={p.x} y={H - 5} textAnchor="middle" fontSize="9" fill="#9ca3af">{label}</text>
          )
        })}
        <text x={PAD_L - 5} y={10} textAnchor="end" fontSize="9" fill="#6b7280">bpm</text>
      </svg>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/parinti/sportiv/${childId}`)}
          className="text-gray-400 hover:text-gray-600 text-sm mb-2"
        >
          &larr; Inapoi la profil
        </button>
        <h1 className="font-heading font-bold text-2xl text-dinamo-blue">
          Fitness{childName ? ` — ${childName}` : ''}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Date fitness si activitate fizica</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg border p-3 text-center">
            <div className="text-xs text-gray-500">Puls mediu</div>
            <div className="font-bold text-lg text-red-600">
              {summary.avgHeartRate != null ? `${summary.avgHeartRate} bpm` : '-'}
            </div>
            <div className="text-xs text-gray-400">30 zile</div>
          </div>
          <div className="bg-white rounded-lg border p-3 text-center">
            <div className="text-xs text-gray-500">Distanta</div>
            <div className="font-bold text-lg text-blue-600">
              {(summary.totalDistance / 1000).toFixed(1)} km
            </div>
            <div className="text-xs text-gray-400">30 zile</div>
          </div>
          <div className="bg-white rounded-lg border p-3 text-center">
            <div className="text-xs text-gray-500">Somn mediu</div>
            <div className="font-bold text-lg text-purple-600">
              {summary.avgSleep != null ? `${summary.avgSleep} ore` : '-'}
            </div>
            <div className="text-xs text-gray-400">30 zile</div>
          </div>
          <div className="bg-white rounded-lg border p-3 text-center">
            <div className="text-xs text-gray-500">Sesiuni</div>
            <div className="font-bold text-lg text-green-600">
              {summary.sessionCount}
            </div>
            <div className="text-xs text-gray-400">30 zile</div>
          </div>
        </div>
      )}

      {/* Heart Rate Chart */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <h2 className="font-medium text-sm mb-3">Evolutie puls mediu</h2>
        {renderChart()}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-medium text-sm mb-3">Istoric fitness</h2>
        {entries.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Nu exista inregistrari fitness.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium">Data</th>
                  <th className="text-center p-3 font-medium">HR avg</th>
                  <th className="text-center p-3 font-medium">HR max</th>
                  <th className="text-center p-3 font-medium">Distanta</th>
                  <th className="text-center p-3 font-medium">Sprinturi</th>
                  <th className="text-center p-3 font-medium">Calorii</th>
                  <th className="text-center p-3 font-medium">Somn</th>
                  <th className="text-left p-3 font-medium">Sursa</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap">{new Date(entry.date).toLocaleDateString('ro-RO')}</td>
                    <td className="p-3 text-center">{entry.heartRateAvg ?? '-'}</td>
                    <td className="p-3 text-center">{entry.heartRateMax ?? '-'}</td>
                    <td className="p-3 text-center">{entry.distance != null ? `${(entry.distance / 1000).toFixed(1)} km` : '-'}</td>
                    <td className="p-3 text-center">{entry.sprintCount ?? '-'}</td>
                    <td className="p-3 text-center">{entry.calories ?? '-'}</td>
                    <td className="p-3 text-center">{entry.sleepHours != null ? `${entry.sleepHours}h` : '-'}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        entry.source === 'manual' ? 'bg-gray-100 text-gray-600' :
                        entry.source === 'garmin' ? 'bg-blue-100 text-blue-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {entry.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
