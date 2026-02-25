import { NextResponse } from 'next/server'
import { getNextDinamoMatch } from '@/lib/results'

export async function GET() {
  const next = getNextDinamoMatch()

  if (!next) {
    return NextResponse.json(
      { message: 'Nu există meciuri programate.' },
      { status: 404 }
    )
  }

  return NextResponse.json(next)
}
