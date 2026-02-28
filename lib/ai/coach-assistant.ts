import { prisma } from '@/lib/prisma'
import { analyzeAthlete, type AthleteAnalysis } from './analysis'

// ── Types ──────────────────────────────────────────────────────────────

export interface TeamSuggestion {
  teamId: number
  teamName: string
  totalAthletes: number
  averageAttendanceRate: number
  topPerformers: {
    childId: string
    name: string
    averageScore: number
  }[]
  decliningAthletes: {
    childId: string
    name: string
    decliningSkills: string[]
  }[]
  atRiskAthletes: {
    childId: string
    name: string
    reason: string
    attendanceRate: number | null
  }[]
  focusAreas: {
    skill: string
    label: string
    averageScore: number
    recommendation: string
  }[]
  recommendations: string[]
}

export interface AthleteRecommendation {
  childId: string
  childName: string
  analysis: AthleteAnalysis
  textRecommendations: string[]
  riskAlerts: string[]
  positiveNotes: string[]
}

export interface OverviewAlert {
  type: 'attendance_critical' | 'performance_drop' | 'team_low_attendance' | 'no_evaluation' | 'positive'
  severity: 'high' | 'medium' | 'low' | 'info'
  title: string
  message: string
  childId?: string
  childName?: string
  teamId?: number
  teamName?: string
}

// ── Skill labels ────────────────────────────────────────────────────────

const SKILL_KEYS = ['physical', 'technical', 'tactical', 'mental', 'social'] as const
const SKILL_LABELS: Record<string, string> = {
  physical: 'Fizic',
  technical: 'Tehnic',
  tactical: 'Tactic',
  mental: 'Mental',
  social: 'Social',
}

// ── Team Suggestions ────────────────────────────────────────────────────

export async function getTeamSuggestions(teamId: number): Promise<TeamSuggestion> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      children: {
        select: { id: true, name: true },
      },
    },
  })

  if (!team) {
    throw new Error('Echipa negasita')
  }

  const childIds = team.children.map(c => c.id)

  if (childIds.length === 0) {
    return {
      teamId,
      teamName: team.grupa,
      totalAthletes: 0,
      averageAttendanceRate: 0,
      topPerformers: [],
      decliningAthletes: [],
      atRiskAthletes: [],
      focusAreas: [],
      recommendations: ['Echipa nu are sportivi inregistrati.'],
    }
  }

  // Fetch attendance for all children in team (last 3 months)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const allAttendance = await prisma.attendance.findMany({
    where: {
      childId: { in: childIds },
      date: { gte: threeMonthsAgo },
    },
  })

  // Calculate per-child attendance rates
  const childAttendanceMap = new Map<string, { total: number; present: number }>()
  for (const a of allAttendance) {
    const entry = childAttendanceMap.get(a.childId) || { total: 0, present: 0 }
    entry.total++
    if (a.present) entry.present++
    childAttendanceMap.set(a.childId, entry)
  }

  // Overall average attendance
  let totalRate = 0
  let countWithAttendance = 0
  childAttendanceMap.forEach(val => {
    if (val.total > 0) {
      totalRate += (val.present / val.total) * 100
      countWithAttendance++
    }
  })
  const averageAttendanceRate = countWithAttendance > 0 ? Math.round(totalRate / countWithAttendance) : 0

  // Fetch latest evaluations for each child
  const latestEvaluations = await prisma.evaluation.findMany({
    where: { childId: { in: childIds } },
    orderBy: { date: 'desc' },
    include: { child: { select: { id: true, name: true } } },
  })

  // Group evaluations by child, keep last 2
  const evalsByChild = new Map<string, typeof latestEvaluations>()
  for (const ev of latestEvaluations) {
    const existing = evalsByChild.get(ev.childId) || []
    if (existing.length < 2) {
      existing.push(ev)
      evalsByChild.set(ev.childId, existing)
    }
  }

  // Top performers (by average of latest evaluation)
  const performerScores: { childId: string; name: string; averageScore: number }[] = []
  const skillTotals: Record<string, { sum: number; count: number }> = {}
  for (const k of SKILL_KEYS) {
    skillTotals[k] = { sum: 0, count: 0 }
  }

  evalsByChild.forEach((evals, childId) => {
    if (evals.length === 0) return
    const latest = evals[0]
    const avg = Math.round(((latest.physical + latest.technical + latest.tactical + latest.mental + latest.social) / 5) * 10) / 10
    performerScores.push({
      childId,
      name: latest.child.name,
      averageScore: avg,
    })

    // Accumulate for team averages
    for (const k of SKILL_KEYS) {
      skillTotals[k].sum += latest[k] as number
      skillTotals[k].count++
    }
  })

  performerScores.sort((a, b) => b.averageScore - a.averageScore)
  const topPerformers = performerScores.slice(0, 5)

  // Declining athletes
  const decliningAthletes: TeamSuggestion['decliningAthletes'] = []
  evalsByChild.forEach((evals, childId) => {
    if (evals.length < 2) return
    const [latest, previous] = evals
    const declining: string[] = []
    for (const k of SKILL_KEYS) {
      if ((latest[k] as number) < (previous[k] as number)) {
        declining.push(SKILL_LABELS[k])
      }
    }
    if (declining.length >= 2) {
      decliningAthletes.push({
        childId,
        name: latest.child.name,
        decliningSkills: declining,
      })
    }
  })

  // At-risk athletes (low attendance or long absence)
  const atRiskAthletes: TeamSuggestion['atRiskAthletes'] = []
  for (const child of team.children) {
    const att = childAttendanceMap.get(child.id)
    const rate = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null

    if (rate !== null && rate < 60) {
      atRiskAthletes.push({
        childId: child.id,
        name: child.name,
        reason: `Prezenta scazuta: ${rate}%`,
        attendanceRate: rate,
      })
    } else if (rate === null || (att && att.total === 0)) {
      // Check if child had any attendance at all
      const anyAttendance = await prisma.attendance.findFirst({
        where: { childId: child.id },
        orderBy: { date: 'desc' },
      })
      if (anyAttendance) {
        atRiskAthletes.push({
          childId: child.id,
          name: child.name,
          reason: 'Fara prezenta in ultimele 3 luni',
          attendanceRate: 0,
        })
      }
    }
  }

  // Focus areas (skills with lowest team average)
  const focusAreas: TeamSuggestion['focusAreas'] = []
  for (const k of SKILL_KEYS) {
    const { sum, count } = skillTotals[k]
    if (count === 0) continue
    const avg = Math.round((sum / count) * 10) / 10
    let recommendation = ''
    if (avg < 5) {
      recommendation = `Scor mediu foarte scazut (${avg}/10). Prioritizati exercitii de ${SKILL_LABELS[k].toLowerCase()} in antrenamente.`
    } else if (avg < 7) {
      recommendation = `Scor mediu de ${avg}/10. Includeti mai multe exercitii de ${SKILL_LABELS[k].toLowerCase()}.`
    } else {
      recommendation = `Scor bun (${avg}/10). Mentineti nivelul actual si dezvoltati excelenta.`
    }
    focusAreas.push({
      skill: k,
      label: SKILL_LABELS[k],
      averageScore: avg,
      recommendation,
    })
  }
  focusAreas.sort((a, b) => a.averageScore - b.averageScore)

  // Overall recommendations
  const recommendations: string[] = []

  if (averageAttendanceRate < 70) {
    recommendations.push(`Rata medie de prezenta a echipei (${averageAttendanceRate}%) este sub 70%. Investigati cauzele absentelor frecvente.`)
  } else if (averageAttendanceRate >= 85) {
    recommendations.push(`Excelent! Rata medie de prezenta este ${averageAttendanceRate}%. Echipa arata angajament ridicat.`)
  }

  if (decliningAthletes.length > 0) {
    recommendations.push(`${decliningAthletes.length} sportiv${decliningAthletes.length > 1 ? 'i' : ''} arata scadere la mai multe competente. Acordati atentie individuala.`)
  }

  if (atRiskAthletes.length > 0) {
    recommendations.push(`${atRiskAthletes.length} sportiv${atRiskAthletes.length > 1 ? 'i' : ''} cu risc de abandon (prezenta scazuta). Contactati parintii.`)
  }

  const weakestSkill = focusAreas[0]
  if (weakestSkill && weakestSkill.averageScore < 6) {
    recommendations.push(`Zona cea mai slaba a echipei: ${weakestSkill.label} (medie ${weakestSkill.averageScore}/10). Planificati sesiuni dedicate.`)
  }

  if (team.children.length > 0) {
    const withEvals = evalsByChild.size
    const withoutEvals = team.children.length - withEvals
    if (withoutEvals > 0) {
      recommendations.push(`${withoutEvals} sportiv${withoutEvals > 1 ? 'i' : ''} fara evaluare. Programati evaluari pentru toti sportivii.`)
    }
  }

  return {
    teamId,
    teamName: team.grupa,
    totalAthletes: team.children.length,
    averageAttendanceRate,
    topPerformers,
    decliningAthletes,
    atRiskAthletes,
    focusAreas,
    recommendations,
  }
}

// ── Athlete Recommendations ─────────────────────────────────────────────

export async function getAthleteRecommendations(childId: string): Promise<AthleteRecommendation> {
  const analysis = await analyzeAthlete(childId)

  const textRecommendations: string[] = []
  const riskAlerts: string[] = []
  const positiveNotes: string[] = []

  // ── Positive notes ──
  if (analysis.attendanceRate !== null && analysis.attendanceRate >= 85) {
    positiveNotes.push(`Excelenta prezenta generala: ${analysis.attendanceRate}%. Sportivul este dedicat si constant.`)
  }

  if (analysis.attendanceTrend === 'improving') {
    positiveNotes.push('Tendinta de prezenta este in crestere. Continuati sa incurajati sportivul.')
  }

  const improvingSkills = analysis.skillTrends.filter(t => t.trend === 'improving')
  if (improvingSkills.length > 0) {
    const details = improvingSkills.map(s => `${s.label} (+${s.change})`).join(', ')
    positiveNotes.push(`Imbunatatire la: ${details}. Progres vizibil!`)
  }

  if (analysis.strengths.length > 0) {
    positiveNotes.push(`Puncte forte: ${analysis.strengths.join(', ')}. Valorificati aceste calitati in joc.`)
  }

  // ── Risk alerts ──
  for (const risk of analysis.risks) {
    if (risk.severity === 'high') {
      riskAlerts.push(`ATENTIE: ${risk.message}`)
    } else if (risk.severity === 'medium') {
      riskAlerts.push(`Atentie: ${risk.message}`)
    }
  }

  if (analysis.attendanceRateLast3Months !== null && analysis.attendanceRateLast3Months < 70) {
    riskAlerts.push(`Atentie: rata de prezenta a scazut sub 70% in ultimele 3 luni (${analysis.attendanceRateLast3Months}%).`)
  }

  // ── Text recommendations ──
  // From analysis recommendations
  textRecommendations.push(...analysis.recommendations)

  // Additional contextual recommendations
  if (analysis.latestEvaluation && analysis.previousEvaluation) {
    const latestAvg = (analysis.latestEvaluation.physical + analysis.latestEvaluation.technical +
      analysis.latestEvaluation.tactical + analysis.latestEvaluation.mental + analysis.latestEvaluation.social) / 5
    const prevAvg = (analysis.previousEvaluation.physical + analysis.previousEvaluation.technical +
      analysis.previousEvaluation.tactical + analysis.previousEvaluation.mental + analysis.previousEvaluation.social) / 5

    if (latestAvg > prevAvg + 1) {
      textRecommendations.push(
        `Scorul mediu a crescut de la ${prevAvg.toFixed(1)} la ${latestAvg.toFixed(1)}. Sportivul raspunde bine la antrenamente.`
      )
    } else if (latestAvg < prevAvg - 1) {
      textRecommendations.push(
        `Scorul mediu a scazut de la ${prevAvg.toFixed(1)} la ${latestAvg.toFixed(1)}. Evaluati cauzele (motivatie, oboseala, probleme personale).`
      )
    }
  }

  if (analysis.physicalGrowth) {
    const { heightChange, weightChange } = analysis.physicalGrowth
    if (heightChange && heightChange > 3) {
      textRecommendations.push(
        `Sportivul a crescut ${heightChange} cm. In perioadele de crestere rapida, acordati atentie exercitiilor de coordonare si evitati suprasolicitarea articulatiilor.`
      )
    }
    if (weightChange && weightChange > 3) {
      textRecommendations.push(
        `Crestere in greutate de ${weightChange} kg. Verificati daca este proportionala cu cresterea in inaltime si adaptati nutritia.`
      )
    }
  }

  return {
    childId,
    childName: analysis.childName,
    analysis,
    textRecommendations,
    riskAlerts,
    positiveNotes,
  }
}

// ── Overview Alerts ─────────────────────────────────────────────────────

export async function getOverviewAlerts(): Promise<OverviewAlert[]> {
  const alerts: OverviewAlert[] = []
  const now = new Date()

  // Get all active children with teams
  const children = await prisma.child.findMany({
    where: { teamId: { not: null } },
    include: { team: { select: { id: true, grupa: true } } },
  })

  if (children.length === 0) {
    return alerts
  }

  const childIds = children.map(c => c.id)

  // ── Attendance alerts (last month) ──
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const recentAttendance = await prisma.attendance.findMany({
    where: {
      childId: { in: childIds },
      date: { gte: oneMonthAgo },
    },
  })

  const childAttendanceMap = new Map<string, { total: number; present: number }>()
  for (const a of recentAttendance) {
    const entry = childAttendanceMap.get(a.childId) || { total: 0, present: 0 }
    entry.total++
    if (a.present) entry.present++
    childAttendanceMap.set(a.childId, entry)
  }

  for (const child of children) {
    const att = childAttendanceMap.get(child.id)
    if (att && att.total > 0) {
      const rate = Math.round((att.present / att.total) * 100)
      if (rate < 50) {
        alerts.push({
          type: 'attendance_critical',
          severity: 'high',
          title: 'Prezenta critica',
          message: `${child.name} (${child.team?.grupa}) — prezenta ${rate}% in ultima luna`,
          childId: child.id,
          childName: child.name,
          teamId: child.teamId || undefined,
          teamName: child.team?.grupa,
        })
      }
    }
  }

  // ── Evaluation score drops ──
  const allEvaluations = await prisma.evaluation.findMany({
    where: { childId: { in: childIds } },
    orderBy: { date: 'desc' },
    include: { child: { select: { id: true, name: true, teamId: true, team: { select: { grupa: true } } } } },
  })

  const evalsByChild = new Map<string, typeof allEvaluations>()
  for (const ev of allEvaluations) {
    const existing = evalsByChild.get(ev.childId) || []
    if (existing.length < 2) {
      existing.push(ev)
      evalsByChild.set(ev.childId, existing)
    }
  }

  evalsByChild.forEach(evals => {
    if (evals.length < 2) return
    const [latest, previous] = evals
    const skills = ['physical', 'technical', 'tactical', 'mental', 'social'] as const
    const drops: string[] = []

    for (const k of skills) {
      const diff = (latest[k] as number) - (previous[k] as number)
      if (diff <= -2) {
        drops.push(`${SKILL_LABELS[k]} (${diff})`)
      }
    }

    if (drops.length > 0) {
      alerts.push({
        type: 'performance_drop',
        severity: 'medium',
        title: 'Scadere performanta',
        message: `${latest.child.name} (${latest.child.team?.grupa}) — scaderi: ${drops.join(', ')}`,
        childId: latest.childId,
        childName: latest.child.name,
        teamId: latest.child.teamId || undefined,
        teamName: latest.child.team?.grupa,
      })
    }
  })

  // ── Teams with low average attendance ──
  const teams = await prisma.team.findMany({
    where: { active: true },
    include: { children: { select: { id: true } } },
  })

  for (const team of teams) {
    if (team.children.length === 0) continue
    const teamChildIds = team.children.map(c => c.id)
    let teamTotal = 0
    let teamPresent = 0

    for (const cid of teamChildIds) {
      const att = childAttendanceMap.get(cid)
      if (att) {
        teamTotal += att.total
        teamPresent += att.present
      }
    }

    if (teamTotal > 0) {
      const teamRate = Math.round((teamPresent / teamTotal) * 100)
      if (teamRate < 60) {
        alerts.push({
          type: 'team_low_attendance',
          severity: 'medium',
          title: 'Prezenta echipa scazuta',
          message: `Echipa ${team.grupa} — prezenta medie ${teamRate}% in ultima luna`,
          teamId: team.id,
          teamName: team.grupa,
        })
      }
    }
  }

  // ── New athletes without evaluations ──
  const childrenWithEvals = new Set(evalsByChild.keys())
  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  for (const child of children) {
    if (!childrenWithEvals.has(child.id)) {
      // Check if child has some attendance (is active)
      const hasAttendance = childAttendanceMap.has(child.id)
      if (hasAttendance) {
        alerts.push({
          type: 'no_evaluation',
          severity: 'low',
          title: 'Fara evaluare',
          message: `${child.name} (${child.team?.grupa}) participa la antrenamente dar nu are nicio evaluare`,
          childId: child.id,
          childName: child.name,
          teamId: child.teamId || undefined,
          teamName: child.team?.grupa,
        })
      }
    }
  }

  // ── Sort alerts by severity ──
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2, info: 3 }
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return alerts
}
