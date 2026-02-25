'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface Evaluation {
  date: string
  period: string
  physical: number
  technical: number
  tactical: number
  mental: number
  social: number
}

interface Props {
  evaluations: Evaluation[]
}

const COLORS = {
  physical: '#ef4444',
  technical: '#3b82f6',
  tactical: '#22c55e',
  mental: '#a855f7',
  social: '#f59e0b',
}

const LABELS: Record<string, string> = {
  physical: 'Fizic',
  technical: 'Tehnic',
  tactical: 'Tactic',
  mental: 'Mental',
  social: 'Social',
}

export default function ProgressChart({ evaluations }: Props) {
  const data = [...evaluations]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(ev => ({
      name: ev.period || new Date(ev.date).toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' }),
      physical: ev.physical,
      technical: ev.technical,
      tactical: ev.tactical,
      mental: ev.mental,
      social: ev.social,
    }))

  if (data.length === 0) return <p className="text-gray-400 text-sm text-center py-8">Nu exista evaluari.</p>

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {(Object.keys(COLORS) as (keyof typeof COLORS)[]).map(key => (
          <Line key={key} type="monotone" dataKey={key} name={LABELS[key]} stroke={COLORS[key]} strokeWidth={2} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
