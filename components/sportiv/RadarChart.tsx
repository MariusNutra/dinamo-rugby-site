'use client'

import { ResponsiveContainer, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts'

interface EvalData {
  physical: number
  technical: number
  tactical: number
  mental: number
  social: number
}

interface Props {
  current: EvalData
  previous?: EvalData | null
  size?: number
}

const LABELS: Record<string, string> = {
  physical: 'Fizic',
  technical: 'Tehnic',
  tactical: 'Tactic',
  mental: 'Mental',
  social: 'Social',
}

export default function RadarChartComponent({ current, previous }: Props) {
  const keys = ['physical', 'technical', 'tactical', 'mental', 'social'] as const
  const data = keys.map(k => ({
    subject: LABELS[k],
    curent: current[k],
    anterior: previous ? previous[k] : undefined,
    fullMark: 10,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsRadar cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
        <Radar name="Curent" dataKey="curent" stroke="#dc2626" fill="#dc2626" fillOpacity={0.3} />
        {previous && (
          <Radar name="Anterior" dataKey="anterior" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.1} strokeDasharray="5 5" />
        )}
        <Legend />
      </RechartsRadar>
    </ResponsiveContainer>
  )
}
