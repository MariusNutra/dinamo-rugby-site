'use client'

interface Props {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export default function EvalSlider({ label, value, onChange, min = 1, max = 10 }: Props) {
  const percent = ((value - min) / (max - min)) * 100
  // Color gradient from red (low) to green (high)
  const hue = (percent / 100) * 120 // 0=red, 120=green

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium w-16 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-dinamo-red"
        style={{ accentColor: `hsl(${hue}, 70%, 45%)` }}
      />
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{ backgroundColor: `hsl(${hue}, 70%, 45%)` }}
      >
        {value}
      </span>
    </div>
  )
}
