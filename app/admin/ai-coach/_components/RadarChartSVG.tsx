// ── SVG Radar Chart Component ───────────────────────────────────────────

export function RadarChartSVG({ scores }: { scores: { physical: number; technical: number; tactical: number; mental: number; social: number } }) {
  const cx = 150
  const cy = 150
  const R = 120
  const skills = [
    { key: 'physical', label: 'Fizic' },
    { key: 'technical', label: 'Tehnic' },
    { key: 'tactical', label: 'Tactic' },
    { key: 'mental', label: 'Mental' },
    { key: 'social', label: 'Social' },
  ]

  // Calculate vertex positions for a regular pentagon
  // Start from the top (-90 degrees)
  const getPoint = (index: number, radius: number) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  }

  // Background grid pentagons at 2, 4, 6, 8, 10
  const gridLevels = [2, 4, 6, 8, 10]

  // Data polygon
  const dataPoints = skills.map((s, i) => {
    const value = scores[s.key as keyof typeof scores] || 0
    const r = (value / 10) * R
    return getPoint(i, r)
  })
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  // Label positions (slightly outside the pentagon)
  const labelPoints = skills.map((_, i) => getPoint(i, R + 20))

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
      {/* Background grid */}
      {gridLevels.map(level => {
        const r = (level / 10) * R
        const points = skills.map((_, i) => getPoint(i, r))
        const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
        return (
          <path
            key={level}
            d={path}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={level === 10 ? 1.5 : 0.8}
          />
        )
      })}

      {/* Axis lines from center to each vertex */}
      {skills.map((_, i) => {
        const p = getPoint(i, R)
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="#e5e7eb"
            strokeWidth={0.8}
          />
        )
      })}

      {/* Data polygon */}
      <path
        d={dataPath}
        fill="rgba(220, 38, 38, 0.25)"
        stroke="#dc2626"
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={`point-${i}`}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="#dc2626"
          stroke="white"
          strokeWidth={1.5}
        />
      ))}

      {/* Labels */}
      {skills.map((s, i) => {
        const p = labelPoints[i]
        return (
          <text
            key={`label-${i}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-medium fill-gray-700"
            fontSize={11}
          >
            {s.label}
          </text>
        )
      })}

      {/* Score values next to data points */}
      {skills.map((s, i) => {
        const value = scores[s.key as keyof typeof scores] || 0
        const r = (value / 10) * R
        const p = getPoint(i, r)
        // Offset the score label slightly
        const labelR = Math.max(r - 15, 10)
        const lp = getPoint(i, labelR)
        return (
          <text
            key={`score-${i}`}
            x={value > 3 ? lp.x : p.x}
            y={value > 3 ? lp.y : p.y - 12}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] font-bold fill-red-700"
            fontSize={10}
          >
            {value}
          </text>
        )
      })}
    </svg>
  )
}
