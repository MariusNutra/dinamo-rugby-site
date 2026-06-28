export interface CompetitionTeam {
  id: string
  competitionId: string
  teamName: string
  points: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
}

export interface Match {
  id: string
  category: string
  matchType: string
  round: string | null
  date: string
  location: string | null
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  isDinamo: boolean
  notes: string | null
  competitionId: string | null
}

export interface Competition {
  id: string
  name: string
  type: string
  season: string | null
  category: string | null
  startDate: string | null
  endDate: string | null
  description: string | null
  active: boolean
  teams: CompetitionTeam[]
  matches?: Match[]
  teamCount: number
  matchCount: number
}

export interface CompetitionForm {
  name: string
  type: string
  season: string
  category: string
  startDate: string
  endDate: string
  description: string
  teamsText: string
}

export interface EditCompetitionForm extends CompetitionForm {
  id: string
}

export interface MatchFormState {
  category: string
  matchType: string
  round: string
  date: string
  location: string
  homeTeam: string
  awayTeam: string
  homeScore: string
  awayScore: string
  notes: string
}
