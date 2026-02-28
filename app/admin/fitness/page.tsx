'use client'

import { useState, useEffect, useCallback } from 'react'

interface ChildRow {
  id: string
  name: string
  teamName: string | null
}

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

interface FormData {
  date: string
  heartRateAvg: string
  heartRateMax: string
  distance: string
  sprintCount: string
  calories: string
  sleepHours: string
  notes: string
}

const emptyForm: FormData = {
  date: new Date().toISOString().split('T')[0],
  heartRateAvg: '',
  heartRateMax: '',
  distance: '',
  sprintCount: '',
  calories: '',
  sleepHours: '',
  notes: '',
}

export default function AdminFitnessPage() {
  const [children, setChildren] = useState<ChildRow[]>([])
  const [search, setSearch] = useState('')
  const [selectedChild, setSelectedChild] = useState<ChildRow | null>(null)
  const [entries, setEntries] = useState<FitnessEntry[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Fetch children list
  useEffect(() => {
    fetch('/api/admin/parinti').then(r => r.json()).then(data => {
      if (!Array.isArray(data)) return
      const all: ChildRow[] = []
      data.forEach((p: { children?: { id: string; name: string; teamId: number | null; teamName?: string }[] }) => {
        p.children?.forEach(c => {
          all.push({ id: c.id, name: c.name, teamName: c.teamName || null })
        })
      })
      all.sort((a, b) => a.name.localeCompare(b.name))
      setChildren(all)
    })
  }, [])

  const fetchData = useCallback((childId: string) => {
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/fitness/${childId}`).then(r => r.json()),
      fetch(`/api/admin/fitness/${childId}/summary`).then(r => r.json()),
    ]).then(([entriesData, summaryData]) => {
      if (Array.isArray(entriesData)) setEntries(entriesData)
      if (summaryData && !summaryData.error) setSummary(summaryData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedChild) fetchData(selectedChild.id)
  }, [selectedChild, fetchData])

  const filteredChildren = children.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectChild = (child: ChildRow) => {
    setSelectedChild(child)
    setSearch(child.name)
    setDropdownOpen(false)
  }

  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (entry: FitnessEntry) => {
    setEditId(entry.id)
    setForm({
      date: entry.date.split('T')[0],
      heartRateAvg: entry.heartRateAvg?.toString() || '',
      heartRateMax: entry.heartRateMax?.toString() || '',
      distance: entry.distance != null ? (entry.distance / 1000).toString() : '',
      sprintCount: entry.sprintCount?.toString() || '',
      calories: entry.calories?.toString() || '',
      sleepHours: entry.sleepHours?.toString() || '',
      notes: entry.notes || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!selectedChild) return
    setSaving(true)
    setMessage('')

    const payload = {
      date: form.date,
      heartRateAvg: form.heartRateAvg ? Number(form.heartRateAvg) : null,
      heartRateMax: form.heartRateMax ? Number(form.heartRateMax) : null,
      distance: form.distance ? Number(form.distance) * 1000 : null,
      sprintCount: form.sprintCount ? Number(form.sprintCount) : null,
      calories: form.calories ? Number(form.calories) : null,
      sleepHours: form.sleepHours ? Number(form.sleepHours) : null,
      notes: form.notes || null,
    }

    const url = editId
      ? `/api/admin/fitness/${selectedChild.id}/${editId}`
      : `/api/admin/fitness/${selectedChild.id}`
    const method = editId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setShowModal(false)
      setMessage(editId ? 'Inregistrare actualizata!' : 'Inregistrare adaugata!')
      setTimeout(() => setMessage(''), 3000)
      fetchData(selectedChild.id)
    } else {
      const err = await res.json().catch(() => ({}))
      setMessage(err.error || 'Eroare la salvare')
    }
    setSaving(false)
  }

  const handleDelete = async (entryId: string) => {
    if (!selectedChild || !confirm('Sterge aceasta inregistrare?')) return
    const res = await fetch(`/api/admin/fitness/${selectedChild.id}/${entryId}`, { method: 'DELETE' })
    if (res.ok) {
      fetchData(selectedChild.id)
      setMessage('Inregistrare stearsa!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

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

    // Grid lines (5 horizontal)
    const gridLines = []
    for (let i = 0; i <= 4; i++) {
      const y = PAD_T + (plotH / 4) * i
      const val = Math.round(maxVal - (range / 4) * i)
      gridLines.push({ y, val })
    }

    // X axis labels (show max 6)
    const labelStep = Math.max(1, Math.floor(chartData.length / 6))
    const xLabels = points.filter((_, i) => i % labelStep === 0 || i === points.length - 1)

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Grid */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={g.y} x2={W - PAD_R} y2={g.y} stroke="#e5e7eb" strokeWidth="1" />
            <text x={PAD_L - 5} y={g.y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{g.val}</text>
          </g>
        ))}
        {/* Line */}
        <path d={linePath} fill="none" stroke="#dc2626" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#dc2626" />
        ))}
        {/* X labels */}
        {xLabels.map((p, i) => {
          const d = new Date(p.date)
          const label = `${d.getDate()}/${d.getMonth() + 1}`
          return (
            <text key={i} x={p.x} y={H - 5} textAnchor="middle" fontSize="9" fill="#9ca3af">{label}</text>
          )
        })}
        {/* Axis labels */}
        <text x={PAD_L - 5} y={10} textAnchor="end" fontSize="9" fill="#6b7280">bpm</text>
      </svg>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-heading font-bold text-2xl mb-6">Fitness Tracking</h1>

      {/* Athlete selector */}
      <div className="relative mb-6">
        <label className="text-sm font-medium text-gray-700 block mb-1">Selecteaza sportiv</label>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setDropdownOpen(true) }}
          onFocus={() => setDropdownOpen(true)}
          placeholder="Cauta sportiv..."
          className="w-full md:w-80 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dinamo-blue"
        />
        {dropdownOpen && search.length > 0 && filteredChildren.length > 0 && (
          <div className="absolute z-20 mt-1 w-full md:w-80 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredChildren.map(c => (
              <button
                key={c.id}
                onClick={() => selectChild(c)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex justify-between"
              >
                <span>{c.name}</span>
                {c.teamName && <span className="text-xs text-gray-400">{c.teamName}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4 text-center font-medium">
          {message}
        </div>
      )}

      {selectedChild && (
        <>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-md p-4">
                    <div className="text-xs text-red-600 font-medium">Puls mediu</div>
                    <div className="text-2xl font-bold text-red-700 mt-1">
                      {summary.avgHeartRate != null ? `${summary.avgHeartRate} bpm` : '-'}
                    </div>
                    <div className="text-xs text-red-400 mt-1">ultimele 30 zile</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-4">
                    <div className="text-xs text-blue-600 font-medium">Distanta totala</div>
                    <div className="text-2xl font-bold text-blue-700 mt-1">
                      {(summary.totalDistance / 1000).toFixed(1)} km
                    </div>
                    <div className="text-xs text-blue-400 mt-1">ultimele 30 zile</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-4">
                    <div className="text-xs text-purple-600 font-medium">Somn mediu</div>
                    <div className="text-2xl font-bold text-purple-700 mt-1">
                      {summary.avgSleep != null ? `${summary.avgSleep} ore` : '-'}
                    </div>
                    <div className="text-xs text-purple-400 mt-1">ultimele 30 zile</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-4">
                    <div className="text-xs text-green-600 font-medium">Sesiuni</div>
                    <div className="text-2xl font-bold text-green-700 mt-1">
                      {summary.sessionCount}
                    </div>
                    <div className="text-xs text-green-400 mt-1">ultimele 30 zile</div>
                  </div>
                </div>
              )}

              {/* Heart Rate Chart */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className="font-medium text-sm mb-3">Evolutie puls mediu</h2>
                {renderChart()}
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-medium text-sm">Inregistrari fitness</h2>
                  <button
                    onClick={openAdd}
                    className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    + Adauga inregistrare
                  </button>
                </div>

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
                          <th className="text-left p-3 font-medium">Note</th>
                          <th className="text-right p-3 font-medium">Actiuni</th>
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
                            <td className="p-3 text-gray-500 max-w-32 truncate">{entry.notes || '-'}</td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <button onClick={() => openEdit(entry)} className="text-blue-500 hover:text-blue-700 text-xs mr-2">
                                Editeaza
                              </button>
                              <button onClick={() => handleDelete(entry.id)} className="text-red-500 hover:text-red-700 text-xs">
                                Sterge
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="font-bold text-lg mb-4">
              {editId ? 'Editeaza inregistrare' : 'Adauga inregistrare fitness'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Data *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Puls mediu (bpm)</label>
                  <input
                    type="number"
                    value={form.heartRateAvg}
                    onChange={e => setForm(prev => ({ ...prev, heartRateAvg: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                    placeholder="ex: 135"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Puls maxim (bpm)</label>
                  <input
                    type="number"
                    value={form.heartRateMax}
                    onChange={e => setForm(prev => ({ ...prev, heartRateMax: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                    placeholder="ex: 185"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Distanta (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.distance}
                    onChange={e => setForm(prev => ({ ...prev, distance: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                    placeholder="ex: 3.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Sprinturi</label>
                  <input
                    type="number"
                    value={form.sprintCount}
                    onChange={e => setForm(prev => ({ ...prev, sprintCount: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                    placeholder="ex: 12"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Calorii</label>
                  <input
                    type="number"
                    value={form.calories}
                    onChange={e => setForm(prev => ({ ...prev, calories: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                    placeholder="ex: 450"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Somn (ore)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.sleepHours}
                    onChange={e => setForm(prev => ({ ...prev, sleepHours: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                    placeholder="ex: 8.5"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Note</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  rows={3}
                  placeholder="Observatii, starea sportivului..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Anuleaza
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.date}
                className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Se salveaza...' : 'Salveaza'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
