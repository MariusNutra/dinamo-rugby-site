import { teamColorOptions } from '@/lib/team-colors'

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {teamColorOptions.map(c => (
        <button key={c.key} type="button" onClick={() => onChange(c.key)}
          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${c.gradient} transition-all ${
            value === c.key ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'
          }`}
          title={c.label}>
          {value === c.key && (
            <svg className="w-5 h-5 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      ))}
    </div>
  )
}
