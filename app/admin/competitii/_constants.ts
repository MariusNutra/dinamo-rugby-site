import type { CompetitionForm, MatchFormState } from './_types'

export const TYPE_LABELS: Record<string, string> = {
  liga: 'Liga',
  turneu: 'Turneu',
  cupa: 'Cupa',
}

export const TYPE_COLORS: Record<string, string> = {
  liga: 'bg-blue-100 text-blue-800',
  turneu: 'bg-green-100 text-green-800',
  cupa: 'bg-amber-100 text-amber-800',
}

export const emptyForm: CompetitionForm = {
  name: '',
  type: 'turneu',
  season: '',
  category: '',
  startDate: '',
  endDate: '',
  description: '',
  teamsText: '',
}

export const emptyMatchForm: MatchFormState = {
  category: '',
  matchType: 'turneu',
  round: '',
  date: '',
  location: '',
  homeTeam: '',
  awayTeam: '',
  homeScore: '',
  awayScore: '',
  notes: '',
}
