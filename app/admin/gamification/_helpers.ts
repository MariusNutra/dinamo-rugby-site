import { CATEGORY_OPTIONS, SKILL_OPTIONS } from './_constants'

export function getCriteriaLabel(criteria: string): string {
  try {
    const c = JSON.parse(criteria)
    switch (c.type) {
      case 'manual': return 'Manual'
      case 'attendance_streak': return `${c.days} prezente consecutive`
      case 'attendance_total': return `${c.count} prezente total`
      case 'evaluation_score': {
        const skill = SKILL_OPTIONS.find(s => s.value === c.skill)?.label || c.skill
        return `${skill} >= ${c.min}`
      }
      case 'evaluation_improvement': {
        const skill = SKILL_OPTIONS.find(s => s.value === c.skill)?.label || c.skill
        return `${skill} +${c.percent}%`
      }
      default: return '-'
    }
  } catch {
    return '-'
  }
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_OPTIONS.find(c => c.value === category)?.label || category
}
