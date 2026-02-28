import { prisma } from '@/lib/prisma'
import StatisticiClient from './StatisticiClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Statistici | Dinamo Rugby Juniori',
  description: 'Statistici despre performanțele echipelor de rugby juniori ale CS Dinamo București.',
}

async function getStats(teamId?: number) {
  const childFilter = teamId ? { teamId } : {}

  const allChildren = await prisma.child.findMany({
    where: childFilter,
    select: {
      id: true,
      name: true,
      teamId: true,
      team: { select: { grupa: true } },
    },
  })

  const childIds = allChildren.map(c => c.id)

  const attendanceRecords = await prisma.attendance.findMany({
    where: { childId: { in: childIds } },
    select: { childId: true, present: true },
  })

  const attendanceMap: Record<string, { total: number; present: number }> = {}
  for (const rec of attendanceRecords) {
    if (!attendanceMap[rec.childId]) {
      attendanceMap[rec.childId] = { total: 0, present: 0 }
    }
    attendanceMap[rec.childId].total++
    if (rec.present) attendanceMap[rec.childId].present++
  }

  const childMap = new Map(allChildren.map(c => [c.id, c]))

  const topAttendance = Object.entries(attendanceMap)
    .map(([childId, stats]) => {
      const child = childMap.get(childId)
      return {
        childId,
        name: child?.name ?? 'Necunoscut',
        teamId: child?.teamId ?? null,
        grupa: child?.team?.grupa ?? '—',
        totalPresent: stats.present,
        totalSessions: stats.total,
        percent: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
      }
    })
    .sort((a, b) => b.totalPresent - a.totalPresent)
    .slice(0, 10)

  const evaluationRecords = await prisma.evaluation.findMany({
    where: { childId: { in: childIds } },
    select: {
      childId: true,
      physical: true,
      technical: true,
      tactical: true,
      mental: true,
      social: true,
    },
  })

  const evalMap: Record<string, { sum: number; count: number }> = {}
  for (const ev of evaluationRecords) {
    if (!evalMap[ev.childId]) {
      evalMap[ev.childId] = { sum: 0, count: 0 }
    }
    const avg = (ev.physical + ev.technical + ev.tactical + ev.mental + ev.social) / 5
    evalMap[ev.childId].sum += avg
    evalMap[ev.childId].count++
  }

  const topEvaluations = Object.entries(evalMap)
    .map(([childId, stats]) => {
      const child = childMap.get(childId)
      return {
        childId,
        name: child?.name ?? 'Necunoscut',
        teamId: child?.teamId ?? null,
        grupa: child?.team?.grupa ?? '—',
        averageScore: parseFloat((stats.sum / stats.count).toFixed(2)),
      }
    })
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 10)

  const teams = await prisma.team.findMany({
    where: teamId ? { id: teamId } : { active: true },
    select: { id: true, grupa: true },
    orderBy: { sortOrder: 'asc' },
  })

  const teamStats = await Promise.all(
    teams.map(async (team) => {
      const totalChildren = await prisma.child.count({ where: { teamId: team.id } })

      const teamAttendance = await prisma.attendance.findMany({
        where: { child: { teamId: team.id } },
        select: { present: true },
      })
      const totalSessions = teamAttendance.length
      const totalPresent = teamAttendance.filter(a => a.present).length
      const avgAttendance = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0

      const teamEvals = await prisma.evaluation.findMany({
        where: { child: { teamId: team.id } },
        select: { physical: true, technical: true, tactical: true, mental: true, social: true },
      })
      let avgEvaluation = 0
      if (teamEvals.length > 0) {
        const totalScore = teamEvals.reduce(
          (sum, ev) => sum + (ev.physical + ev.technical + ev.tactical + ev.mental + ev.social) / 5,
          0
        )
        avgEvaluation = parseFloat((totalScore / teamEvals.length).toFixed(2))
      }

      return {
        teamId: team.id,
        grupa: team.grupa,
        totalChildren,
        avgAttendance,
        avgEvaluation,
      }
    })
  )

  return { topAttendance, topEvaluations, teamStats }
}

export default async function StatisticiPage() {
  const [stats, activeTeams] = await Promise.all([
    getStats(),
    prisma.team.findMany({
      where: { active: true },
      select: { id: true, grupa: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  return <StatisticiClient initialStats={stats} teams={activeTeams} />
}
