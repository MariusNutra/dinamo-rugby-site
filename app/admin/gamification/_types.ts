export interface Badge {
  id: string
  name: string
  icon: string
  description: string | null
  criteria: string
  category: string
  active: boolean
  createdAt: string
  _count?: { athletes: number }
}

export interface LeaderboardEntry {
  childId: string
  name: string
  teamName: string | null
  totalPoints: number
  badgeCount: number
}

export interface Team {
  id: number
  grupa: string
}

export interface ChildOption {
  id: string
  name: string
  teamName: string | null
}

export interface PointRecord {
  id: string
  amount: number
  reason: string
  createdAt: string
}
