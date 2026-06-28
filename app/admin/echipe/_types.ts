export interface Team {
  id: number
  grupa: string
  coachName: string
  coachPhoto: string | null
  coachBio: string | null
  schedule: string | null
  description: string | null
  active: boolean
  color: string
  sortOrder: number
  ageRange: string | null
  birthYear: string | null
}

export interface Coach {
  id: string
  name: string
  description: string | null
  photo: string | null
  order: number
  teamId: number
}

export interface TrainingSession {
  id: number
  grupa: string
  day: string
  startTime: string
  endTime: string
  location: string
  coachName: string | null
}
