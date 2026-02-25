export const teamColorOptions = [
  { key: 'green', label: 'Verde', gradient: 'from-green-500 to-green-700', border: 'border-green-500 bg-green-50', text: 'text-green-700', bg: 'bg-green-500' },
  { key: 'blue', label: 'Albastru', gradient: 'from-blue-500 to-blue-700', border: 'border-blue-500 bg-blue-50', text: 'text-blue-700', bg: 'bg-blue-500' },
  { key: 'red', label: 'Roșu', gradient: 'from-red-500 to-red-700', border: 'border-red-500 bg-red-50', text: 'text-red-700', bg: 'bg-red-500' },
  { key: 'purple', label: 'Mov', gradient: 'from-purple-500 to-purple-700', border: 'border-purple-500 bg-purple-50', text: 'text-purple-700', bg: 'bg-purple-500' },
  { key: 'orange', label: 'Portocaliu', gradient: 'from-orange-500 to-orange-700', border: 'border-orange-500 bg-orange-50', text: 'text-orange-700', bg: 'bg-orange-500' },
  { key: 'teal', label: 'Teal', gradient: 'from-teal-500 to-teal-700', border: 'border-teal-500 bg-teal-50', text: 'text-teal-700', bg: 'bg-teal-500' },
  { key: 'indigo', label: 'Indigo', gradient: 'from-indigo-500 to-indigo-700', border: 'border-indigo-500 bg-indigo-50', text: 'text-indigo-700', bg: 'bg-indigo-500' },
  { key: 'pink', label: 'Roz', gradient: 'from-pink-500 to-pink-700', border: 'border-pink-500 bg-pink-50', text: 'text-pink-700', bg: 'bg-pink-500' },
] as const

export type TeamColorKey = typeof teamColorOptions[number]['key']

export function getColorConfig(key: string) {
  return teamColorOptions.find(c => c.key === key) || teamColorOptions[0]
}
