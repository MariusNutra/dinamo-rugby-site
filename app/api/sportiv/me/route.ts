import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAthleteChildId } from '@/lib/athlete-auth'

/**
 * Ce vede sportivul despre el insusi: echipa, prezenta lui, punctele si
 * insignele, plus programul echipei. Nimic despre alti copii — clasamentul
 * are ruta lui, cu numele celorlalti limitate la propria echipa.
 */
export async function GET() {
  const childId = await getAthleteChildId()
  if (!childId) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: {
      id: true,
      name: true,
      birthYear: true,
      username: true,
      accessEnabled: true,
      team: { select: { id: true, grupa: true } },
    },
  })

  // Parintele poate inchide accesul oricand; un cookie inca valid nu trebuie sa
  // treaca peste decizia lui.
  if (!child || !child.accessEnabled) {
    return NextResponse.json({ error: 'Acces inchis' }, { status: 403 })
  }

  const inceputLuna = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const [prezente, puncte, insigne, program, ultimaEvaluare] = await Promise.all([
    prisma.attendance.findMany({ where: { childId, date: { gte: inceputLuna } } }),
    prisma.points.findMany({ where: { childId }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.athleteBadge.findMany({
      where: { childId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    }),
    child.team
      ? prisma.trainingSession.findMany({ where: { grupa: child.team.grupa } })
      : Promise.resolve([]),
    prisma.evaluation.findFirst({ where: { childId }, orderBy: { date: 'desc' } }),
  ])

  const totalPrezente = prezente.length
  const prezent = prezente.filter((p) => p.present).length

  return NextResponse.json({
    id: child.id,
    name: child.name,
    birthYear: child.birthYear,
    username: child.username,
    teamName: child.team?.grupa ?? null,
    prezenta: {
      procent: totalPrezente > 0 ? Math.round((prezent / totalPrezente) * 100) : 0,
      prezent,
      total: totalPrezente,
    },
    puncte: {
      total: puncte.reduce((s, p) => s + p.amount, 0),
      ultimele: puncte.map((p) => ({
        amount: p.amount,
        reason: p.reason,
        createdAt: p.createdAt.toISOString(),
      })),
    },
    insigne: insigne.map((i) => ({
      id: i.id,
      nume: i.badge.name,
      descriere: i.badge.description,
      icon: i.badge.icon,
      castigataLa: i.earnedAt.toISOString(),
    })),
    program: program.map((t) => ({
      zi: t.day,
      deLa: t.startTime,
      panaLa: t.endTime,
      locatie: t.location,
    })),
    ultimaEvaluare: ultimaEvaluare
      ? {
          data: ultimaEvaluare.date.toISOString(),
          medie:
            (ultimaEvaluare.physical +
              ultimaEvaluare.technical +
              ultimaEvaluare.tactical +
              ultimaEvaluare.mental +
              ultimaEvaluare.social) /
            5,
        }
      : null,
  })
}
