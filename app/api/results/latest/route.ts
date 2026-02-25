import { NextRequest, NextResponse } from 'next/server'
import { getLatestDinamoResults } from '@/lib/results'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const limit = parseInt(searchParams.get('limit') || '5', 10)
  const results = getLatestDinamoResults(Math.min(limit, 20))

  return NextResponse.json(results)
}
