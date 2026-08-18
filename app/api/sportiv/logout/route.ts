import { NextResponse } from 'next/server'

export async function POST() {
  const raspuns = NextResponse.json({ success: true })
  raspuns.cookies.delete('athlete_token')
  return raspuns
}
