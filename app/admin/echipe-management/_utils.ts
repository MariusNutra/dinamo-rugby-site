export const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const formatDateRelative = (dateStr: string) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'azi'
  if (diffDays === 1) return 'ieri'
  if (diffDays < 7) return `acum ${diffDays} zile`
  if (diffDays < 30) return `acum ${Math.floor(diffDays / 7)} sapt.`
  return formatDate(dateStr)
}
