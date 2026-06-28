export interface ScoutingReport {
  id: string
  eventName: string
  eventDate: string
  location: string | null
  notes: string | null
  createdBy: string | null
  createdAt: string
  _count?: { prospects: number }
}

export interface Prospect {
  id: string
  name: string
  birthYear: number | null
  position: string | null
  currentClub: string | null
  notes: string | null
  rating: number
  status: string
  phone: string | null
  email: string | null
  scoutingReportId: string | null
  scoutingReport?: {
    id: string
    eventName: string
    eventDate: string
  } | null
  createdAt: string
}
