import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed

  // --- Helper: start of a given month ---
  const startOfMonth = (year: number, month: number) => new Date(year, month, 1)
  const endOfMonth = (year: number, month: number) => new Date(year, month + 1, 1)

  // --- KPI: Total active children (have a team assigned) ---
  const totalChildren = await prisma.child.count({
    where: { teamId: { not: null } },
  })

  // Children count last month for trend
  const lastMonthStart = startOfMonth(currentYear, currentMonth - 1)
  const lastMonthEnd = endOfMonth(currentYear, currentMonth - 1)
  const thisMonthStart = startOfMonth(currentYear, currentMonth)
  const thisMonthEnd = endOfMonth(currentYear, currentMonth)

  const childrenLastMonth = await prisma.child.count({
    where: {
      teamId: { not: null },
      createdAt: { lt: lastMonthEnd },
    },
  })

  // --- KPI: Monthly revenue (completed payments this month) ---
  const paymentsThisMonth = await prisma.payment.findMany({
    where: {
      status: 'completed',
      createdAt: { gte: thisMonthStart, lt: thisMonthEnd },
    },
    select: { amount: true },
  })
  const revenueThisMonth = paymentsThisMonth.reduce((sum, p) => sum + p.amount, 0)

  const paymentsLastMonth = await prisma.payment.findMany({
    where: {
      status: 'completed',
      createdAt: { gte: lastMonthStart, lt: lastMonthEnd },
    },
    select: { amount: true },
  })
  const revenueLastMonth = paymentsLastMonth.reduce((sum, p) => sum + p.amount, 0)

  // --- KPI: Attendance rate this month ---
  const attendanceThisMonth = await prisma.attendance.findMany({
    where: {
      date: { gte: thisMonthStart, lt: thisMonthEnd },
    },
    select: { present: true },
  })
  const totalAttThisMonth = attendanceThisMonth.length
  const presentThisMonth = attendanceThisMonth.filter(a => a.present).length
  const attendanceRateThisMonth = totalAttThisMonth > 0
    ? Math.round((presentThisMonth / totalAttThisMonth) * 100)
    : 0

  const attendanceLastMonth = await prisma.attendance.findMany({
    where: {
      date: { gte: lastMonthStart, lt: lastMonthEnd },
    },
    select: { present: true },
  })
  const totalAttLastMonth = attendanceLastMonth.length
  const presentLastMonth = attendanceLastMonth.filter(a => a.present).length
  const attendanceRateLastMonth = totalAttLastMonth > 0
    ? Math.round((presentLastMonth / totalAttLastMonth) * 100)
    : 0

  // --- KPI: Active subscriptions (payments with type containing 'abonament' and status pending/active) ---
  const activeSubscriptions = await prisma.payment.count({
    where: {
      type: { contains: 'abonament' },
      status: { in: ['completed', 'active'] },
      createdAt: { gte: thisMonthStart },
    },
  })

  // --- Attendance Trend: Last 12 months ---
  const attendanceTrend: { month: string; total: number; uniqueChildren: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const mStart = new Date(currentYear, currentMonth - i, 1)
    const mEnd = new Date(currentYear, currentMonth - i + 1, 1)
    const monthLabel = mStart.toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' })

    const records = await prisma.attendance.findMany({
      where: {
        date: { gte: mStart, lt: mEnd },
        present: true,
      },
      select: { childId: true },
    })

    const uniqueChildIds = new Set(records.map(r => r.childId))

    attendanceTrend.push({
      month: monthLabel,
      total: records.length,
      uniqueChildren: uniqueChildIds.size,
    })
  }

  // --- Revenue Trend: Last 12 months ---
  const revenueTrend: { month: string; amount: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const mStart = new Date(currentYear, currentMonth - i, 1)
    const mEnd = new Date(currentYear, currentMonth - i + 1, 1)
    const monthLabel = mStart.toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' })

    const payments = await prisma.payment.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: mStart, lt: mEnd },
      },
      select: { amount: true },
    })

    revenueTrend.push({
      month: monthLabel,
      amount: payments.reduce((sum, p) => sum + p.amount, 0),
    })
  }

  // --- Registrations Trend: Last 6 months ---
  const registrationsTrend: { month: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(currentYear, currentMonth - i, 1)
    const mEnd = new Date(currentYear, currentMonth - i + 1, 1)
    const monthLabel = mStart.toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' })

    const count = await prisma.registration.count({
      where: {
        createdAt: { gte: mStart, lt: mEnd },
      },
    })

    registrationsTrend.push({ month: monthLabel, count })
  }

  // --- Team Comparison ---
  const teams = await prisma.team.findMany({
    where: { active: true },
    select: {
      id: true,
      grupa: true,
      children: {
        where: { teamId: { not: null } },
        select: { id: true },
      },
    },
  })

  const teamComparison: {
    teamName: string
    childCount: number
    attendanceRate: number
    avgEvaluation: number
  }[] = []

  for (const team of teams) {
    const childIds = team.children.map(c => c.id)
    const childCount = childIds.length

    // Attendance rate for this team (last 3 months)
    const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1)
    let attendanceRate = 0
    if (childCount > 0) {
      const teamAttendance = await prisma.attendance.findMany({
        where: {
          childId: { in: childIds },
          date: { gte: threeMonthsAgo },
        },
        select: { present: true },
      })
      const totalAtt = teamAttendance.length
      const presentAtt = teamAttendance.filter(a => a.present).length
      attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0
    }

    // Average evaluation for this team (latest evaluations)
    let avgEvaluation = 0
    if (childCount > 0) {
      const evaluations = await prisma.evaluation.findMany({
        where: { childId: { in: childIds } },
        select: { physical: true, technical: true, tactical: true, mental: true, social: true },
        orderBy: { date: 'desc' },
        take: childCount * 2, // recent evaluations
      })
      if (evaluations.length > 0) {
        const totalScore = evaluations.reduce((sum, e) => {
          return sum + (e.physical + e.technical + e.tactical + e.mental + e.social) / 5
        }, 0)
        avgEvaluation = Math.round((totalScore / evaluations.length) * 10) / 10
      }
    }

    teamComparison.push({
      teamName: team.grupa,
      childCount,
      attendanceRate,
      avgEvaluation,
    })
  }

  // Sort teams by child count descending
  teamComparison.sort((a, b) => b.childCount - a.childCount)

  // --- Retention Rate ---
  // % of children who had attendance last month AND also this month
  const childrenLastMonthAttendance = await prisma.attendance.findMany({
    where: {
      date: { gte: lastMonthStart, lt: lastMonthEnd },
      present: true,
    },
    select: { childId: true },
    distinct: ['childId'],
  })
  const lastMonthChildIds = new Set(childrenLastMonthAttendance.map(a => a.childId))

  let retentionRate = 0
  if (lastMonthChildIds.size > 0) {
    const childrenThisMonthAttendance = await prisma.attendance.findMany({
      where: {
        date: { gte: thisMonthStart, lt: thisMonthEnd },
        present: true,
        childId: { in: Array.from(lastMonthChildIds) },
      },
      select: { childId: true },
      distinct: ['childId'],
    })
    retentionRate = Math.round((childrenThisMonthAttendance.length / lastMonthChildIds.size) * 100)
  }

  // --- Recent Activity (last 10 items) ---
  type Activity = {
    type: 'registration' | 'payment' | 'attendance'
    description: string
    timestamp: string
  }

  const recentActivities: Activity[] = []

  // Recent registrations
  const recentRegs = await prisma.registration.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      childFirstName: true,
      childLastName: true,
      createdAt: true,
      team: { select: { grupa: true } },
    },
  })
  for (const reg of recentRegs) {
    recentActivities.push({
      type: 'registration',
      description: `Inscriere noua: ${reg.childFirstName} ${reg.childLastName}${reg.team ? ` - ${reg.team.grupa}` : ''}`,
      timestamp: reg.createdAt.toISOString(),
    })
  }

  // Recent payments
  const recentPayments = await prisma.payment.findMany({
    where: { status: 'completed' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      amount: true,
      type: true,
      createdAt: true,
      parent: { select: { name: true } },
      child: { select: { name: true } },
    },
  })
  for (const pay of recentPayments) {
    const who = pay.child?.name || pay.parent?.name || 'Necunoscut'
    recentActivities.push({
      type: 'payment',
      description: `Plata ${pay.amount} RON (${pay.type}) - ${who}`,
      timestamp: pay.createdAt.toISOString(),
    })
  }

  // Recent attendance records
  const recentAttendance = await prisma.attendance.findMany({
    where: { present: true },
    orderBy: { date: 'desc' },
    take: 10,
    select: {
      date: true,
      child: { select: { name: true } },
      team: { select: { grupa: true } },
      createdAt: true,
    },
  })
  for (const att of recentAttendance) {
    recentActivities.push({
      type: 'attendance',
      description: `Prezenta: ${att.child.name}${att.team ? ` - ${att.team.grupa}` : ''}`,
      timestamp: (att.createdAt || att.date).toISOString(),
    })
  }

  // Sort all activities by timestamp descending, take 10
  recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const recentActivity = recentActivities.slice(0, 10)

  return NextResponse.json({
    kpi: {
      totalChildren,
      childrenTrend: childrenLastMonth > 0
        ? Math.round(((totalChildren - childrenLastMonth) / childrenLastMonth) * 100)
        : 0,
      revenueThisMonth,
      revenueTrend: revenueLastMonth > 0
        ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
        : 0,
      attendanceRate: attendanceRateThisMonth,
      attendanceTrend: attendanceRateThisMonth - attendanceRateLastMonth,
      activeSubscriptions,
      retentionRate,
    },
    attendanceTrend,
    revenueTrend,
    registrationsTrend,
    teamComparison,
    recentActivity,
  })
}
