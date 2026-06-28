export const STATUS_COLUMNS = [
  { key: 'identified', label: 'Identificat', color: 'gray' },
  { key: 'contacted', label: 'Contactat', color: 'blue' },
  { key: 'trial', label: 'Trial', color: 'amber' },
  { key: 'enrolled', label: 'Inscris', color: 'green' },
  { key: 'rejected', label: 'Respins', color: 'red' },
] as const

export const STATUS_BORDER_COLORS: Record<string, string> = {
  identified: 'border-l-gray-400',
  contacted: 'border-l-blue-500',
  trial: 'border-l-amber-500',
  enrolled: 'border-l-green-500',
  rejected: 'border-l-red-500',
}

export const STATUS_BG_COLORS: Record<string, string> = {
  identified: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  trial: 'bg-amber-100 text-amber-700',
  enrolled: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}
