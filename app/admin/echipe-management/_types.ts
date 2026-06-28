export interface Team {
  id: number
  grupa: string
  color: string
  sortOrder: number
  active: boolean
}

export interface ChildRow {
  id: string
  name: string
  birthYear: number
  teamId: number | null
  teamName: string | null
  parentName: string
  parentEmail?: string
}

export interface TransferInfo {
  id: string
  childId: string
  fromTeamGrupa: string
  toTeamGrupa: string
  reason: string | null
  movedBy: string
  createdAt: string
  childName: string
  childBirthYear: number
}

export interface Toast {
  id: number
  message: string
  type?: 'success' | 'error' | 'info'
}

export interface PendingTransfer {
  childId: string
  childName: string
  fromTeamName: string
  toTeamId: number | null
  toTeamName: string
}
