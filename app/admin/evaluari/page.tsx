'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import EvalBulkForm from '@/components/sportiv/EvalBulkForm'

const RadarChart = dynamic(() => import('@/components/sportiv/RadarChart'), { ssr: false })

interface Team {
  id: number
  grupa: string
}

interface Child {
  id: string
  name: string
}

interface Evaluation {
  id: string
  date: string
  period: string
  physical: number
  technical: number
  tactical: number
  mental: number
  social: number
  comments: string | null
  child: { id: string; name: string; team?: { grupa: string } | null }
}

export default function EvaluariPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [mode, setMode] = useState<'list' | 'bulk'>('list')
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [period, setPeriod] = useState('')
  const [previewData, setPreviewData] = useState<{ physical: number; technical: number; tactical: number; mental: number; social: number } | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/teams').then(r => r.json()).then(data => {
      setTeams(data.filter((t: Team & { active?: boolean }) => t.active !== false))
    })
    // Generate default period name
    const now = new Date()
    const q = Math.ceil((now.getMonth() + 1) / 3)
    setPeriod(`T${q} ${now.getFullYear()}`)
  }, [])

  useEffect(() => {
    if (!selectedTeam) return
    // Fetch evaluations for team
    fetch(`/api/admin/evaluari?teamId=${selectedTeam}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEvaluations(data) })
    // Fetch children for team
    fetch('/api/admin/parinti').then(r => r.json()).then(data => {
      if (!Array.isArray(data)) return
      const teamChildren: Child[] = []
      data.forEach((p: { children?: { id: string; name: string; teamId: number | null }[] }) => {
        p.children?.forEach(c => {
          if (c.teamId === selectedTeam) teamChildren.push({ id: c.id, name: c.name })
        })
      })
      teamChildren.sort((a, b) => a.name.localeCompare(b.name))
      setChildren(teamChildren)
    })
  }, [selectedTeam])

  const handleBulkSave = async (evals: { childId: string; physical: number; technical: number; tactical: number; mental: number; social: number; comments: string }[]) => {
    const res = await fetch('/api/admin/evaluari/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evaluations: evals, period }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      // Refresh list
      fetch(`/api/admin/evaluari?teamId=${selectedTeam}`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setEvaluations(data) })
      setMode('list')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sterge aceasta evaluare?')) return
    const res = await fetch(`/api/admin/evaluari/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setEvaluations(prev => prev.filter(e => e.id !== id))
    }
  }

  const avgScore = (e: Evaluation) => ((e.physical + e.technical + e.tactical + e.mental + e.social) / 5).toFixed(1)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Evaluari</h1>
        {selectedTeam && (
          <div className="flex gap-2">
            <button
              onClick={() => setMode('list')}
              className={`px-3 py-1.5 rounded text-sm ${mode === 'list' ? 'bg-dinamo-blue text-white' : 'bg-gray-100'}`}
            >
              Lista
            </button>
            <button
              onClick={() => setMode('bulk')}
              className={`px-3 py-1.5 rounded text-sm ${mode === 'bulk' ? 'bg-dinamo-blue text-white' : 'bg-gray-100'}`}
            >
              Evaluare noua
            </button>
          </div>
        )}
      </div>

      {/* Team selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {teams.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTeam(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedTeam === t.id ? 'bg-dinamo-red text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.grupa}
          </button>
        ))}
      </div>

      {saved && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4 text-center font-medium">
          Evaluari salvate cu succes!
        </div>
      )}

      {selectedTeam && mode === 'list' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          {evaluations.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Nu exista evaluari pentru aceasta echipa.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium">Sportiv</th>
                  <th className="text-left p-3 font-medium">Perioada</th>
                  <th className="text-left p-3 font-medium">Data</th>
                  <th className="text-center p-3 font-medium">Media</th>
                  <th className="text-right p-3 font-medium">Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map(ev => (
                  <tr key={ev.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{ev.child.name}</td>
                    <td className="p-3 text-gray-600">{ev.period}</td>
                    <td className="p-3 text-gray-600">{new Date(ev.date).toLocaleDateString('ro-RO')}</td>
                    <td className="p-3 text-center font-medium">{avgScore(ev)}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleDelete(ev.id)} className="text-red-500 hover:text-red-700 text-xs">
                        Sterge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedTeam && mode === 'bulk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Perioada</label>
              <input
                type="text"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                placeholder="ex: T1 2026"
              />
            </div>
            {children.length > 0 ? (
              <EvalBulkForm
                players={children}
                period={period}
                onSave={handleBulkSave}
                onPreview={setPreviewData}
              />
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Nu exista copii in aceasta echipa.</p>
            )}
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-4 bg-white rounded-lg border p-4">
              <h3 className="font-medium text-sm mb-2 text-center">Preview evaluare</h3>
              {previewData ? (
                <RadarChart current={previewData} />
              ) : (
                <p className="text-gray-400 text-sm text-center py-12">Selecteaza un sportiv pentru preview</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
