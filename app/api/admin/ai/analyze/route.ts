import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { analyzeAthlete } from '@/lib/ai/analysis'
import { getTeamSuggestions, getAthleteRecommendations } from '@/lib/ai/coach-assistant'

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { childId, teamId } = body

  try {
    if (childId) {
      const analysis = await analyzeAthlete(childId as string)
      const recommendations = await getAthleteRecommendations(childId as string)
      return NextResponse.json({ analysis, recommendations })
    }

    if (teamId) {
      const suggestions = await getTeamSuggestions(Number(teamId))
      return NextResponse.json({ suggestions })
    }

    return NextResponse.json({ error: 'Specificati childId sau teamId' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare interna'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
