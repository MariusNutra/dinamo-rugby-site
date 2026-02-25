'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface Profile {
  date: string
  height: number | null
  weight: number | null
}

interface Props {
  profiles: Profile[]
}

export default function PhysicalChart({ profiles }: Props) {
  const data = [...profiles]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(p => ({
      name: new Date(p.date).toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' }),
      inaltime: p.height,
      greutate: p.weight,
    }))

  if (data.length === 0) return <p className="text-gray-400 text-sm text-center py-8">Nu exista masuratori.</p>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="height" orientation="left" tick={{ fontSize: 11 }} label={{ value: 'cm', position: 'insideTopLeft', fontSize: 11 }} />
        <YAxis yAxisId="weight" orientation="right" tick={{ fontSize: 11 }} label={{ value: 'kg', position: 'insideTopRight', fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line yAxisId="height" type="monotone" dataKey="inaltime" name="Inaltime (cm)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
        <Line yAxisId="weight" type="monotone" dataKey="greutate" name="Greutate (kg)" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}
