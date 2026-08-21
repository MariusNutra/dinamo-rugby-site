import { prisma } from '@/lib/prisma'
import { startOfDay, normalizeWeekday, weekdayOf } from '@/lib/day'

/**
 * Programul de antrenamente e tinut saptamanal, pe grupa („U10", „Marți",
 * „19:00"), in `TrainingSession`. Calendarul de evenimente tine altceva:
 * meciuri si evenimente punctuale, cu data fixa.
 *
 * Ecranul „Program" din aplicatie citea doar calendarul, care e practic gol,
 * deci parintele nu vedea nimic — desi echipa are antrenamente in fiecare
 * saptamana. Aici desfasuram randurile saptamanale in ocurente cu data, ca sa
 * poata fi amestecate cu evenimentele reale intr-o singura lista.
 */

export interface TrainingOccurrence {
  id: string
  title: string
  type: 'training'
  date: string
  startTime: string
  endTime: string
  location: string | null
  description: string | null
  team: { id: number; grupa: string; color: string | null } | null
}

/** „19:00" → minutele de la miezul noptii. Ce nu se poate citi devine 00:00. */
export function minutesOf(time: string | null | undefined): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec((time ?? '').trim())
  if (!match) return 0
  const hours = Math.min(23, parseInt(match[1], 10))
  const minutes = Math.min(59, parseInt(match[2], 10))
  return hours * 60 + minutes
}

function at(day: Date, time: string | null | undefined): Date {
  const d = new Date(day)
  d.setMinutes(minutesOf(time))
  return d
}

/**
 * Ocurentele de antrenament ale unei grupe, din `from` pana peste `days` zile.
 * Un antrenament aflat in desfasurare ramane in lista pana se termina.
 */
export async function trainingOccurrences(
  grupa: string,
  days: number,
  from: Date = new Date()
): Promise<TrainingOccurrence[]> {
  const sessions = await prisma.trainingSession.findMany({ where: { grupa } })
  if (sessions.length === 0) return []

  const team = await prisma.team.findFirst({
    where: { grupa },
    select: { id: true, grupa: true, color: true },
  })

  const occurrences: TrainingOccurrence[] = []
  const firstDay = startOfDay(from)

  for (let offset = 0; offset <= days; offset++) {
    const day = new Date(firstDay)
    day.setDate(day.getDate() + offset)
    const weekday = weekdayOf(day)

    for (const session of sessions) {
      if (normalizeWeekday(session.day) !== weekday) continue

      const start = at(day, session.startTime)
      const end = at(day, session.endTime)
      if (end < from) continue

      occurrences.push({
        id: `training-${session.id}-${day.toISOString().slice(0, 10)}`,
        title: `Antrenament ${grupa}`,
        type: 'training',
        date: start.toISOString(),
        startTime: session.startTime,
        endTime: session.endTime,
        location: session.location,
        description: session.coachName ? `Antrenor: ${session.coachName}` : null,
        team,
      })
    }
  }

  return occurrences
}
