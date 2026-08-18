import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboard } from '@/lib/gamification'
import { getSesiuneClub } from '@/lib/club-session'

export async function GET(req: NextRequest) {
  // Clasamentul contine numele si echipa unor minori. Ruta raspundea oricui,
  // fara niciun cookie: era o lista de copii publicata pe internet, goala doar
  // pentru ca nu se acordase inca niciun punct.
  const sesiune = await getSesiuneClub()
  if (!sesiune.autentificat) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const teamIdParam = searchParams.get('teamId')
  const limitParam = searchParams.get('limit')

  const teamId = teamIdParam ? parseInt(teamIdParam, 10) : undefined
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 10

  // Sportivul vede clasamentul propriei echipe, nu al altora: nu poate cere o
  // alta grupa schimband parametrul din adresa.
  const echipaCeruta =
    sesiune.athleteTeamId !== null
      ? sesiune.athleteTeamId
      : teamId && !isNaN(teamId)
        ? teamId
        : undefined

  const leaderboard = await getLeaderboard(
    echipaCeruta,
    limit && !isNaN(limit) ? limit : 10
  )

  return NextResponse.json(leaderboard)
}
