import { prisma } from '@/lib/prisma'
import { getCoachId } from '@/lib/coach-auth'

/**
 * Cate echipe are antrenorul logat.
 *
 * In baza, un antrenor cu mai multe grupe are **cate un rand `Coach` per
 * echipa** — asa a fost gandit de la inceput, si tot asa le grupeaza si ecranul
 * de administrare: dupa NUME. Aici facem la fel.
 *
 * De ce nu dupa email, care ar fi cheia evidenta: `Coach.email` e `@unique`,
 * deci cele patru randuri ale aceleiasi persoane nu pot purta aceeasi adresa.
 * Un singur rand are email — cel pe care se face logarea — iar celelalte sunt
 * legate de el prin nume.
 *
 * Limita, de stiut: doi antrenori cu acelasi nume ar ajunge sa vada echipele
 * celuilalt. La un club cu trei antrenori e acceptabil; daca apare cazul,
 * solutia e un model de persoana separat de randul per echipa, nu un petec aici.
 */

export interface CoachTeam {
  id: number
  grupa: string
  color: string
  ageRange: string | null
  schedule: string | null
}

export interface CoachContext {
  coachId: string
  name: string
  teams: CoachTeam[]
}

export async function getCoachContext(): Promise<CoachContext | null> {
  const coachId = await getCoachId()
  if (!coachId) return null

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    select: { id: true, name: true },
  })
  if (!coach) return null

  const rows = await prisma.coach.findMany({
    where: { name: coach.name, teamId: { not: null } },
    select: {
      team: {
        select: { id: true, grupa: true, color: true, ageRange: true, schedule: true },
      },
    },
  })

  const teams: CoachTeam[] = []
  const seen = new Set<number>()
  for (const row of rows) {
    if (row.team && !seen.has(row.team.id)) {
      seen.add(row.team.id)
      teams.push(row.team)
    }
  }
  teams.sort((a, b) => a.grupa.localeCompare(b.grupa))

  return { coachId: coach.id, name: coach.name, teams }
}

export interface ResolvedTeam {
  context: CoachContext
  teamId: number
}

/**
 * Verifica faptul ca echipa ceruta e chiar a antrenorului logat.
 *
 * Fara `requested`, alege prima echipa a lui — ca ecranele care nu trimit inca
 * `teamId` sa continue sa mearga. Cu `requested`, un id care nu e al lui
 * inseamna null, adica 403 in ruta apelanta: altfel oricine ar putea citi sau
 * modifica lotul altei grupe schimband un numar in adresa.
 */
export async function resolveCoachTeam(
  requested?: string | number | null
): Promise<ResolvedTeam | null> {
  const context = await getCoachContext()
  if (!context || context.teams.length === 0) return null

  if (requested === undefined || requested === null || requested === '') {
    return { context, teamId: context.teams[0].id }
  }

  const teamId = Number(requested)
  if (!Number.isInteger(teamId)) return null
  if (!context.teams.some(t => t.id === teamId)) return null

  return { context, teamId }
}
