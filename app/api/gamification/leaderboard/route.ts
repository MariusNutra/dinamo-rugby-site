import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboard } from '@/lib/gamification'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const teamIdParam = searchParams.get('teamId')
  const limitParam = searchParams.get('limit')

  const teamId = teamIdParam ? parseInt(teamIdParam, 10) : undefined
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 10

  const leaderboard = await getLeaderboard(
    teamId && !isNaN(teamId) ? teamId : undefined,
    limit && !isNaN(limit) ? limit : 10
  )

  return NextResponse.json(leaderboard)
}
