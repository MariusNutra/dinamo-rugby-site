import { isAdmin } from '@/lib/auth'
import { isParentAuthenticated } from '@/lib/parent-auth'
import { isCoachAuthenticated } from '@/lib/coach-auth'
import { getAthleteChildId } from '@/lib/athlete-auth'
import { prisma } from '@/lib/prisma'

/**
 * „Cineva din club este logat?" — indiferent pe ce poarta a intrat.
 *
 * Exista pentru datele care privesc copiii si nu au ce cauta pe internetul
 * deschis, dar pe care le poate vedea oricine tine de club: clasamentul echipei,
 * de pilda. Fara asta, fiecare ruta ar fi trebuit sa insire manual cele patru
 * verificari — si ar fi fost destul sa uite una.
 */
export interface SesiuneClub {
  autentificat: boolean
  /** Completat doar cand cel logat e sportiv: el vede numai propria echipa. */
  athleteTeamId: number | null
}

export async function getSesiuneClub(): Promise<SesiuneClub> {
  const childId = await getAthleteChildId()
  if (childId) {
    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { teamId: true, accessEnabled: true },
    })
    // Parintele poate inchide accesul; un cookie inca valid nu trece peste el.
    if (child?.accessEnabled) {
      return { autentificat: true, athleteTeamId: child.teamId }
    }
    return { autentificat: false, athleteTeamId: null }
  }

  const [parinte, antrenor, admin] = await Promise.all([
    isParentAuthenticated(),
    isCoachAuthenticated(),
    isAdmin(),
  ])

  return { autentificat: parinte || antrenor || admin, athleteTeamId: null }
}
