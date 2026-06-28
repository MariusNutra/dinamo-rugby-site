// Emoji picker options
export const EMOJI_OPTIONS = ['🏅', '🥇', '🥈', '🥉', '⭐', '🏆', '🎯', '💪', '🔥', '👑', '🦁', '🏉']

export const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'attendance', label: 'Prezenta' },
  { value: 'performance', label: 'Performanta' },
  { value: 'special', label: 'Special' },
]

export const CRITERIA_TYPES = [
  { value: 'manual', label: 'Manual (admin acorda)' },
  { value: 'attendance_streak', label: 'Serie prezente consecutive' },
  { value: 'attendance_total', label: 'Total prezente' },
  { value: 'evaluation_score', label: 'Scor evaluare minim' },
  { value: 'evaluation_improvement', label: 'Imbunatatire evaluare (%)' },
]

export const SKILL_OPTIONS = [
  { value: 'physical', label: 'Fizic' },
  { value: 'technical', label: 'Tehnic' },
  { value: 'tactical', label: 'Tactic' },
  { value: 'mental', label: 'Mental' },
  { value: 'social', label: 'Social' },
]

export const TABS = ['Badges', 'Leaderboard', 'Puncte'] as const
