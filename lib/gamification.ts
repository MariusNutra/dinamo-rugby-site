import { prisma } from '@/lib/prisma'

// --- Types ---

interface AttendanceStreakCriteria {
  type: 'attendance_streak'
  days: number
}

interface AttendanceTotalCriteria {
  type: 'attendance_total'
  count: number
}

interface EvaluationScoreCriteria {
  type: 'evaluation_score'
  skill: 'physical' | 'technical' | 'tactical' | 'mental' | 'social'
  min: number
}

interface EvaluationImprovementCriteria {
  type: 'evaluation_improvement'
  skill: 'physical' | 'technical' | 'tactical' | 'mental' | 'social'
  percent: number
}

interface ManualCriteria {
  type: 'manual'
}

type BadgeCriteria =
  | AttendanceStreakCriteria
  | AttendanceTotalCriteria
  | EvaluationScoreCriteria
  | EvaluationImprovementCriteria
  | ManualCriteria

// --- Criteria Evaluation ---

export async function evaluateBadgeCriteria(
  childId: string,
  criteria: BadgeCriteria
): Promise<boolean> {
  switch (criteria.type) {
    case 'manual':
      return false // manual badges are never auto-awarded

    case 'attendance_total': {
      const count = await prisma.attendance.count({
        where: { childId, present: true },
      })
      return count >= criteria.count
    }

    case 'attendance_streak': {
      const attendances = await prisma.attendance.findMany({
        where: { childId },
        orderBy: { date: 'desc' },
        select: { date: true, present: true },
      })

      if (attendances.length === 0) return false

      // Sort by date ascending
      const sorted = attendances.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      let maxStreak = 0
      let currentStreak = 0

      for (const att of sorted) {
        if (att.present) {
          currentStreak++
          if (currentStreak > maxStreak) maxStreak = currentStreak
        } else {
          currentStreak = 0
        }
      }

      return maxStreak >= criteria.days
    }

    case 'evaluation_score': {
      const latestEval = await prisma.evaluation.findFirst({
        where: { childId },
        orderBy: { date: 'desc' },
      })
      if (!latestEval) return false
      const score = latestEval[criteria.skill] as number
      return score >= criteria.min
    }

    case 'evaluation_improvement': {
      const evaluations = await prisma.evaluation.findMany({
        where: { childId },
        orderBy: { date: 'asc' },
      })
      if (evaluations.length < 2) return false

      const first = evaluations[0]
      const last = evaluations[evaluations.length - 1]
      const firstScore = first[criteria.skill] as number
      const lastScore = last[criteria.skill] as number

      if (firstScore === 0) return lastScore > 0
      const improvement = ((lastScore - firstScore) / firstScore) * 100
      return improvement >= criteria.percent
    }

    default:
      return false
  }
}

// --- Badge Checking & Awarding ---

export async function checkAndAwardBadges(
  childId: string
): Promise<{ badgeId: string; name: string; icon: string }[]> {
  const badges = await prisma.badge.findMany({
    where: { active: true },
  })

  const existingBadges = await prisma.athleteBadge.findMany({
    where: { childId },
    select: { badgeId: true },
  })
  const existingBadgeIds = new Set(existingBadges.map((b) => b.badgeId))

  const newlyAwarded: { badgeId: string; name: string; icon: string }[] = []

  for (const badge of badges) {
    // Skip already earned
    if (existingBadgeIds.has(badge.id)) continue

    let criteria: BadgeCriteria
    try {
      criteria = JSON.parse(badge.criteria) as BadgeCriteria
    } catch {
      continue
    }

    // Skip manual badges
    if (criteria.type === 'manual') continue

    const earned = await evaluateBadgeCriteria(childId, criteria)
    if (earned) {
      await prisma.athleteBadge.create({
        data: { childId, badgeId: badge.id },
      })
      newlyAwarded.push({
        badgeId: badge.id,
        name: badge.name,
        icon: badge.icon,
      })
    }
  }

  return newlyAwarded
}

// --- Points ---

export async function awardPoints(
  childId: string,
  amount: number,
  reason: string
): Promise<{ id: string; amount: number; reason: string }> {
  const points = await prisma.points.create({
    data: { childId, amount, reason },
  })
  return { id: points.id, amount: points.amount, reason: points.reason }
}

export async function getChildPoints(
  childId: string
): Promise<{ total: number; history: { id: string; amount: number; reason: string; createdAt: Date }[] }> {
  const allPoints = await prisma.points.findMany({
    where: { childId },
    orderBy: { createdAt: 'desc' },
  })

  const total = allPoints.reduce((sum, p) => sum + p.amount, 0)

  return {
    total,
    history: allPoints.map((p) => ({
      id: p.id,
      amount: p.amount,
      reason: p.reason,
      createdAt: p.createdAt,
    })),
  }
}

// --- Badges ---

export async function getChildBadges(
  childId: string
): Promise<{ id: string; badgeId: string; name: string; icon: string; description: string | null; category: string; earnedAt: Date }[]> {
  const athleteBadges = await prisma.athleteBadge.findMany({
    where: { childId },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' },
  })

  return athleteBadges.map((ab) => ({
    id: ab.id,
    badgeId: ab.badge.id,
    name: ab.badge.name,
    icon: ab.badge.icon,
    description: ab.badge.description,
    category: ab.badge.category,
    earnedAt: ab.earnedAt,
  }))
}

// --- Leaderboard ---

export async function getLeaderboard(
  teamId?: number,
  limit: number = 10
): Promise<
  {
    childId: string
    name: string
    teamName: string | null
    totalPoints: number
    badgeCount: number
  }[]
> {
  // Build the where clause for children
  const whereClause: { teamId?: number } = {}
  if (teamId) whereClause.teamId = teamId

  const children = await prisma.child.findMany({
    where: whereClause,
    include: {
      team: { select: { grupa: true } },
      points: { select: { amount: true } },
      badges: { select: { id: true } },
    },
  })

  const leaderboard = children
    .map((child) => ({
      childId: child.id,
      name: child.name,
      teamName: child.team?.grupa ?? null,
      totalPoints: child.points.reduce((sum, p) => sum + p.amount, 0),
      badgeCount: child.badges.length,
    }))
    .filter((entry) => entry.totalPoints > 0 || entry.badgeCount > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, limit)

  return leaderboard
}
