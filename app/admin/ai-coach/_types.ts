// ── Types ──────────────────────────────────────────────────────────────

export interface OverviewAlert {
  type: string
  severity: 'high' | 'medium' | 'low' | 'info'
  title: string
  message: string
  childId?: string
  childName?: string
  teamId?: number
  teamName?: string
}

export interface Team {
  id: number
  grupa: string
}

export interface Child {
  id: string
  name: string
  teamId: number | null
  team?: { grupa: string } | null
}

export interface SkillTrend {
  skill: string
  label: string
  previous: number | null
  current: number | null
  change: number | null
  trend: 'improving' | 'declining' | 'stable' | 'unknown'
}

export interface AthleteAnalysis {
  childId: string
  childName: string
  teamId: number | null
  teamName: string | null
  attendanceRate: number | null
  attendanceRateLast3Months: number | null
  attendanceTrend: string
  skillTrends: SkillTrend[]
  strengths: string[]
  weaknesses: string[]
  risks: { type: string; severity: string; message: string }[]
  recommendations: string[]
  latestEvaluation: {
    physical: number
    technical: number
    tactical: number
    mental: number
    social: number
    date: string
    period: string
  } | null
  previousEvaluation: {
    physical: number
    technical: number
    tactical: number
    mental: number
    social: number
    date: string
    period: string
  } | null
  physicalGrowth: {
    latestHeight: number | null
    latestWeight: number | null
    previousHeight: number | null
    previousWeight: number | null
    heightChange: number | null
    weightChange: number | null
    position: string | null
  } | null
  monthlyAttendance: { month: string; rate: number; total: number; present: number }[]
}

export interface AthleteRecommendation {
  childId: string
  childName: string
  analysis: AthleteAnalysis
  textRecommendations: string[]
  riskAlerts: string[]
  positiveNotes: string[]
}

export interface TeamSuggestion {
  teamId: number
  teamName: string
  totalAthletes: number
  averageAttendanceRate: number
  topPerformers: { childId: string; name: string; averageScore: number }[]
  decliningAthletes: { childId: string; name: string; decliningSkills: string[] }[]
  atRiskAthletes: { childId: string; name: string; reason: string; attendanceRate: number | null }[]
  focusAreas: { skill: string; label: string; averageScore: number; recommendation: string }[]
  recommendations: string[]
}
