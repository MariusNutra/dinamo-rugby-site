import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  exportAthletesCSV,
  exportAthletesXML,
  exportCompetitionResultsCSV,
  exportAttendanceCSV,
} from '@/lib/federation-formats'

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const url = new URL(req.url)
  const type = url.searchParams.get('type')

  switch (type) {
    case 'athletes':
      return handleAthletesCSV(url)
    case 'athletes-xml':
      return handleAthletesXML(url)
    case 'competition':
      return handleCompetitionCSV(url)
    case 'attendance':
      return handleAttendanceCSV(url)
    default:
      return NextResponse.json({ error: 'Tip export invalid. Tipuri valide: athletes, athletes-xml, competition, attendance' }, { status: 400 })
  }
}

async function handleAthletesCSV(url: URL) {
  const teamIdParam = url.searchParams.get('teamId')
  const where = teamIdParam ? { teamId: Number(teamIdParam) } : {}

  const children = await prisma.child.findMany({
    where,
    include: { team: true },
    orderBy: { name: 'asc' },
  })

  const athletes = children.map(c => ({
    name: c.name,
    birthYear: c.birthYear,
    teamGrupa: c.team?.grupa || null,
    medicalCert: c.medicalCert,
    photoConsent: c.photoConsent,
  }))

  const csv = exportAthletesCSV(athletes)
  const filename = teamIdParam
    ? `sportivi-legitimati-echipa-${teamIdParam}.csv`
    : 'sportivi-legitimati.csv'

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

async function handleAthletesXML(url: URL) {
  const teamIdParam = url.searchParams.get('teamId')
  const where = teamIdParam ? { teamId: Number(teamIdParam) } : {}

  const children = await prisma.child.findMany({
    where,
    include: { team: true },
    orderBy: { name: 'asc' },
  })

  const athletes = children.map(c => ({
    name: c.name,
    birthYear: c.birthYear,
    teamGrupa: c.team?.grupa || null,
    medicalCert: c.medicalCert,
    photoConsent: c.photoConsent,
  }))

  const xml = exportAthletesXML(athletes)
  const filename = teamIdParam
    ? `sportivi-legitimati-echipa-${teamIdParam}.xml`
    : 'sportivi-legitimati.xml'

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

async function handleCompetitionCSV(url: URL) {
  const competitionId = url.searchParams.get('competitionId')
  if (!competitionId) {
    return NextResponse.json({ error: 'competitionId obligatoriu' }, { status: 400 })
  }

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      teams: { orderBy: { points: 'desc' } },
      matches: { orderBy: { date: 'asc' } },
    },
  })

  if (!competition) {
    return NextResponse.json({ error: 'Competiție negăsită' }, { status: 404 })
  }

  const csv = exportCompetitionResultsCSV(
    {
      name: competition.name,
      type: competition.type,
      season: competition.season,
      category: competition.category,
    },
    competition.teams.map(t => ({
      teamName: t.teamName,
      points: t.points,
      played: t.played,
      won: t.won,
      drawn: t.drawn,
      lost: t.lost,
      goalsFor: t.goalsFor,
      goalsAgainst: t.goalsAgainst,
    })),
    competition.matches.map(m => ({
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      date: m.date.toISOString(),
      round: m.round,
      location: m.location,
    }))
  )

  const safeName = competition.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
  const filename = `rezultate-${safeName}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

async function handleAttendanceCSV(url: URL) {
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json({ error: 'Parametrii from și to sunt obligatorii (format: YYYY-MM-DD)' }, { status: 400 })
  }

  const startDate = new Date(from + 'T00:00:00')
  const endDate = new Date(to + 'T23:59:59')

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: 'Format dată invalid' }, { status: 400 })
  }

  const teamIdParam = url.searchParams.get('teamId')

  const whereClause: Record<string, unknown> = {
    date: { gte: startDate, lte: endDate },
  }
  if (teamIdParam) {
    whereClause.teamId = Number(teamIdParam)
  }

  const attendances = await prisma.attendance.findMany({
    where: whereClause,
    include: { child: true },
    orderBy: [{ date: 'asc' }, { childId: 'asc' }],
  })

  const data = attendances.map(a => ({
    childName: a.child.name,
    date: a.date.toISOString(),
    present: a.present,
    type: a.type,
  }))

  const csv = exportAttendanceCSV(data)
  const filename = `prezente-${from}-${to}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
