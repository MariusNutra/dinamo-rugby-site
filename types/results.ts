export interface MatchResult {
  date: string
  stadium: string
  homeTeam: string
  awayTeam: string
  scoreHome: number | null
  scoreAway: number | null
  played: boolean
  isDinamo: boolean
  matchUrl?: string
}

export interface EtapaGroup {
  name: string
  matches: MatchResult[]
}

export interface StandingRow {
  position: number
  team: string
  played: number
  wins: number
  draws: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  diff: number
  points: number
  bonus: number
  total: number
  isDinamo: boolean
}

export interface RegionData {
  results: EtapaGroup[]
  standings: StandingRow[]
}

export interface CategoryData {
  regions: Record<string, RegionData>
}

export interface ScrapedData {
  lastUpdated: string
  categories: Record<string, CategoryData>
}
