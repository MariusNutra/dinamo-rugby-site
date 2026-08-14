import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveCoachTeam } from '@/lib/coach-teams'

export async function GET(req: NextRequest) {
  const resolved = await resolveCoachTeam(req.nextUrl.searchParams.get('teamId'))

  if (!resolved) {
    // Fie nu e logat, fie n-are nicio echipa, fie a cerut una care nu e a lui.
    // Raspunsul e acelasi: nu are ce vedea aici.
    return NextResponse.json({ team: null, teams: [] })
  }

  const { context, teamId } = resolved
  const team = context.teams.find(t => t.id === teamId)!

  const [playerCount, coachRows] = await Promise.all([
    prisma.child.count({ where: { teamId } }),
    // O grupa poate avea mai multi antrenori — U16 are trei. Ii aratam, ca
    // fiecare sa stie ca lotul e comun si ca modificarile se vad si la ceilalti.
    prisma.coach.findMany({ where: { teamId }, select: { name: true } }),
  ])

  const colleagues = [...new Set(coachRows.map(c => c.name))].filter(n => n !== context.name)

  return NextResponse.json({
    // `team` = echipa selectata, pastrat pentru ecranele care cer una singura.
    team: { ...team, playerCount, colleagues },
    // `teams` = toate grupele antrenorului, pentru selector.
    teams: context.teams,
  })
}
