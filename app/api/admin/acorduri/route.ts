import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const teamId = req.nextUrl.searchParams.get('teamId')
  const status = req.nextUrl.searchParams.get('status')

  const where: Record<string, unknown> = {}

  if (teamId) {
    where.teamId = Number(teamId)
  }

  if (status === 'signed') {
    where.photoConsentDate = { not: null }
  } else if (status === 'unsigned') {
    where.photoConsentDate = null
  }

  const children = await prisma.child.findMany({
    where,
    include: {
      parent: { select: { id: true, name: true, email: true, phone: true } },
      team: { select: { id: true, grupa: true } },
    },
    orderBy: [{ team: { grupa: 'asc' } }, { name: 'asc' }],
  })

  // Global stats (unfiltered)
  const totalChildren = await prisma.child.count()
  const signedCount = await prisma.child.count({
    where: { photoConsentDate: { not: null } },
  })

  // Per-team breakdown
  const teams = await prisma.team.findMany({
    where: { active: true },
    select: { id: true, grupa: true },
    orderBy: { grupa: 'asc' },
  })

  const teamStats = await Promise.all(
    teams.map(async (team) => {
      const teamTotal = await prisma.child.count({ where: { teamId: team.id } })
      const teamSigned = await prisma.child.count({
        where: { teamId: team.id, photoConsentDate: { not: null } },
      })
      return {
        teamId: team.id,
        teamName: team.grupa,
        total: teamTotal,
        signed: teamSigned,
        unsigned: teamTotal - teamSigned,
      }
    })
  )

  // Children without a team
  const noTeamTotal = await prisma.child.count({ where: { teamId: null } })
  const noTeamSigned = await prisma.child.count({
    where: { teamId: null, photoConsentDate: { not: null } },
  })

  if (noTeamTotal > 0) {
    teamStats.push({
      teamId: 0,
      teamName: 'Fara echipa',
      total: noTeamTotal,
      signed: noTeamSigned,
      unsigned: noTeamTotal - noTeamSigned,
    })
  }

  return NextResponse.json({
    children: children.map(c => ({
      id: c.id,
      name: c.name,
      birthYear: c.birthYear,
      teamId: c.teamId,
      teamName: c.team?.grupa ?? null,
      photoConsent: c.photoConsent,
      photoConsentWA: c.photoConsentWA,
      photoConsentDate: c.photoConsentDate,
      signatureData: c.signatureData ? true : false,
      medicalCert: c.medicalCert,
      parentId: c.parent.id,
      parentName: c.parent.name,
      parentEmail: c.parent.email,
      parentPhone: c.parent.phone,
    })),
    stats: {
      total: totalChildren,
      signed: signedCount,
      unsigned: totalChildren - signedCount,
      byTeam: teamStats,
    },
  })
}
