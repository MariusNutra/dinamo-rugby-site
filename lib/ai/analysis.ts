import { prisma } from '@/lib/prisma'

// ── Types ──────────────────────────────────────────────────────────────

export interface SkillTrend {
  skill: string
  label: string
  previous: number | null
  current: number | null
  change: number | null
  trend: 'improving' | 'declining' | 'stable' | 'unknown'
}

export interface RiskFlag {
  type: 'attendance' | 'performance' | 'absence' | 'no_evaluation' | 'dropout'
  severity: 'high' | 'medium' | 'low'
  message: string
}

export interface PhysicalGrowth {
  latestHeight: number | null
  latestWeight: number | null
  previousHeight: number | null
  previousWeight: number | null
  heightChange: number | null
  weightChange: number | null
  position: string | null
}

export interface AthleteAnalysis {
  childId: string
  childName: string
  teamId: number | null
  teamName: string | null
  attendanceRate: number | null
  attendanceRateLast3Months: number | null
  attendanceTrend: 'improving' | 'declining' | 'stable' | 'unknown'
  skillTrends: SkillTrend[]
  strengths: string[]
  weaknesses: string[]
  risks: RiskFlag[]
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
  physicalGrowth: PhysicalGrowth | null
  monthlyAttendance: { month: string; rate: number; total: number; present: number }[]
}

// ── Helpers ────────────────────────────────────────────────────────────

const SKILL_KEYS = ['physical', 'technical', 'tactical', 'mental', 'social'] as const
const SKILL_LABELS: Record<string, string> = {
  physical: 'Fizic',
  technical: 'Tehnic',
  tactical: 'Tactic',
  mental: 'Mental',
  social: 'Social',
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(key: string): string {
  const months = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const [year, month] = key.split('-')
  return `${months[parseInt(month) - 1]} ${year}`
}

function computeTrend(previous: number | null, current: number | null): 'improving' | 'declining' | 'stable' | 'unknown' {
  if (previous === null || current === null) return 'unknown'
  const diff = current - previous
  if (diff > 0) return 'improving'
  if (diff < 0) return 'declining'
  return 'stable'
}

// ── Main Analysis Function ─────────────────────────────────────────────

export async function analyzeAthlete(childId: string): Promise<AthleteAnalysis> {
  // Fetch child with team
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: { team: { select: { id: true, grupa: true } } },
  })

  if (!child) {
    throw new Error('Sportiv negasit')
  }

  // Fetch all attendance records
  const allAttendance = await prisma.attendance.findMany({
    where: { childId },
    orderBy: { date: 'asc' },
  })

  // Fetch evaluations (most recent first)
  const evaluations = await prisma.evaluation.findMany({
    where: { childId },
    orderBy: { date: 'desc' },
    take: 5,
  })

  // Fetch physical profiles
  const physicalProfiles = await prisma.physicalProfile.findMany({
    where: { childId },
    orderBy: { date: 'desc' },
    take: 2,
  })

  // ── Attendance Analysis ──
  const now = new Date()
  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const totalAttendance = allAttendance.length
  const totalPresent = allAttendance.filter(a => a.present).length
  const attendanceRate = totalAttendance > 0 ? Math.round((totalPresent / totalAttendance) * 100) : null

  const last3MonthsAttendance = allAttendance.filter(a => new Date(a.date) >= threeMonthsAgo)
  const last3Present = last3MonthsAttendance.filter(a => a.present).length
  const attendanceRateLast3Months = last3MonthsAttendance.length > 0
    ? Math.round((last3Present / last3MonthsAttendance.length) * 100)
    : null

  // Attendance trend: compare last 3 months to overall
  let attendanceTrend: 'improving' | 'declining' | 'stable' | 'unknown' = 'unknown'
  if (attendanceRate !== null && attendanceRateLast3Months !== null) {
    const diff = attendanceRateLast3Months - attendanceRate
    if (diff > 5) attendanceTrend = 'improving'
    else if (diff < -5) attendanceTrend = 'declining'
    else attendanceTrend = 'stable'
  }

  // Monthly attendance (last 6 months)
  const monthlyAttendance: { month: string; rate: number; total: number; present: number }[] = []
  const last6MonthsAttendance = allAttendance.filter(a => new Date(a.date) >= sixMonthsAgo)
  const monthlyMap = new Map<string, { total: number; present: number }>()

  for (const a of last6MonthsAttendance) {
    const key = getMonthKey(new Date(a.date))
    const entry = monthlyMap.get(key) || { total: 0, present: 0 }
    entry.total++
    if (a.present) entry.present++
    monthlyMap.set(key, entry)
  }

  // Generate last 6 months keys
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const key = getMonthKey(d)
    const entry = monthlyMap.get(key) || { total: 0, present: 0 }
    monthlyAttendance.push({
      month: getMonthLabel(key),
      rate: entry.total > 0 ? Math.round((entry.present / entry.total) * 100) : 0,
      total: entry.total,
      present: entry.present,
    })
  }

  // ── Evaluation Analysis ──
  const latestEval = evaluations[0] || null
  const previousEval = evaluations[1] || null

  const skillTrends: SkillTrend[] = SKILL_KEYS.map(skill => {
    const current = latestEval ? (latestEval[skill] as number) : null
    const previous = previousEval ? (previousEval[skill] as number) : null
    return {
      skill,
      label: SKILL_LABELS[skill],
      previous,
      current,
      change: current !== null && previous !== null ? current - previous : null,
      trend: computeTrend(previous, current),
    }
  })

  // Strengths & weaknesses (from latest evaluation)
  const strengths: string[] = []
  const weaknesses: string[] = []

  if (latestEval) {
    const scores = SKILL_KEYS.map(k => ({ skill: k, label: SKILL_LABELS[k], score: latestEval[k] as number }))
    scores.sort((a, b) => b.score - a.score)

    // Top 2 skills with score >= 7
    for (const s of scores) {
      if (s.score >= 7 && strengths.length < 2) {
        strengths.push(s.label)
      }
    }

    // Bottom 2 skills with score <= 5
    const sorted = [...scores].sort((a, b) => a.score - b.score)
    for (const s of sorted) {
      if (s.score <= 5 && weaknesses.length < 2) {
        weaknesses.push(s.label)
      }
    }
  }

  // ── Risk Flags ──
  const risks: RiskFlag[] = []

  if (attendanceRate !== null && attendanceRate < 60) {
    risks.push({
      type: 'attendance',
      severity: attendanceRate < 40 ? 'high' : 'medium',
      message: `Rata de prezenta generala este ${attendanceRate}% (sub pragul de 60%)`,
    })
  }

  if (attendanceRateLast3Months !== null && attendanceRateLast3Months < 50) {
    risks.push({
      type: 'dropout',
      severity: 'high',
      message: `Rata de prezenta din ultimele 3 luni este ${attendanceRateLast3Months}% — risc de abandon`,
    })
  }

  if (attendanceTrend === 'declining') {
    risks.push({
      type: 'attendance',
      severity: 'medium',
      message: 'Tendinta de prezenta este in scadere fata de media generala',
    })
  }

  // Check for long absence (no attendance in last 30 days)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentAttendance = allAttendance.filter(a => new Date(a.date) >= thirtyDaysAgo && a.present)
  if (allAttendance.length > 0 && recentAttendance.length === 0) {
    risks.push({
      type: 'absence',
      severity: 'high',
      message: 'Sportivul nu a fost prezent la niciun antrenament in ultimele 30 de zile',
    })
  }

  // Declining evaluations
  const decliningSkills = skillTrends.filter(t => t.trend === 'declining')
  if (decliningSkills.length >= 3) {
    risks.push({
      type: 'performance',
      severity: 'high',
      message: `Scadere la ${decliningSkills.length} din 5 competente evaluate: ${decliningSkills.map(s => s.label).join(', ')}`,
    })
  } else if (decliningSkills.length >= 1) {
    risks.push({
      type: 'performance',
      severity: 'medium',
      message: `Scadere la: ${decliningSkills.map(s => s.label).join(', ')}`,
    })
  }

  // No evaluations
  if (evaluations.length === 0) {
    risks.push({
      type: 'no_evaluation',
      severity: 'low',
      message: 'Sportivul nu are nicio evaluare inregistrata',
    })
  }

  // ── Physical Growth ──
  let physicalGrowth: PhysicalGrowth | null = null
  if (physicalProfiles.length > 0) {
    const latest = physicalProfiles[0]
    const prev = physicalProfiles.length > 1 ? physicalProfiles[1] : null
    physicalGrowth = {
      latestHeight: latest.height,
      latestWeight: latest.weight,
      previousHeight: prev?.height || null,
      previousWeight: prev?.weight || null,
      heightChange: latest.height && prev?.height ? Math.round((latest.height - prev.height) * 10) / 10 : null,
      weightChange: latest.weight && prev?.weight ? Math.round((latest.weight - prev.weight) * 10) / 10 : null,
      position: latest.position,
    }
  }

  // ── Build Recommendations ──
  const recommendations: string[] = []

  // Attendance recommendations
  if (attendanceTrend === 'declining') {
    recommendations.push('Prezenta sportivului este in scadere. Recomandare: discutie cu parintele pentru identificarea cauzelor.')
  }
  if (attendanceRateLast3Months !== null && attendanceRateLast3Months < 70 && attendanceRateLast3Months >= 50) {
    recommendations.push(`Rata de prezenta din ultimele 3 luni (${attendanceRateLast3Months}%) este sub medie. Monitorizati situatia.`)
  }

  // Skill recommendations
  const improvingSkills = skillTrends.filter(t => t.trend === 'improving')
  if (improvingSkills.length > 0) {
    recommendations.push(
      `Sportivul arata imbunatatire la: ${improvingSkills.map(s => `${s.label} (${s.change! > 0 ? '+' : ''}${s.change})`).join(', ')}. Continuati cu exercitii specifice.`
    )
  }

  if (decliningSkills.length > 0) {
    recommendations.push(
      `Atentie la competentele in scadere: ${decliningSkills.map(s => `${s.label} (${s.change})`).join(', ')}. Recomandare: antrenamente suplimentare pe aceste componente.`
    )
  }

  if (weaknesses.length > 0 && latestEval) {
    const weakScores = SKILL_KEYS
      .filter(k => weaknesses.includes(SKILL_LABELS[k]))
      .map(k => `${SKILL_LABELS[k]}: ${latestEval[k]}`)
    recommendations.push(`Punctele slabe identificate: ${weakScores.join(', ')}. Planificati exercitii dedicate pentru aceste arii.`)
  }

  if (evaluations.length === 0 && allAttendance.length > 5) {
    recommendations.push('Sportivul participa la antrenamente dar nu a fost evaluat. Programati o evaluare cat mai curand.')
  }

  if (physicalGrowth?.heightChange && physicalGrowth.heightChange > 5) {
    recommendations.push(`Crestere semnificativa in inaltime (+${physicalGrowth.heightChange} cm). Adaptati exercitiile pentru coordonare si flexibilitate.`)
  }

  return {
    childId,
    childName: child.name,
    teamId: child.teamId,
    teamName: child.team?.grupa || null,
    attendanceRate,
    attendanceRateLast3Months,
    attendanceTrend,
    skillTrends,
    strengths,
    weaknesses,
    risks,
    recommendations,
    latestEvaluation: latestEval
      ? {
          physical: latestEval.physical,
          technical: latestEval.technical,
          tactical: latestEval.tactical,
          mental: latestEval.mental,
          social: latestEval.social,
          date: latestEval.date.toISOString(),
          period: latestEval.period,
        }
      : null,
    previousEvaluation: previousEval
      ? {
          physical: previousEval.physical,
          technical: previousEval.technical,
          tactical: previousEval.tactical,
          mental: previousEval.mental,
          social: previousEval.social,
          date: previousEval.date.toISOString(),
          period: previousEval.period,
        }
      : null,
    physicalGrowth,
    monthlyAttendance,
  }
}
