import { NextResponse } from 'next/server'
import { getPhotographerId } from '@/lib/photographer-auth'

export async function GET() {
  const id = await getPhotographerId()
  return NextResponse.json({ authenticated: id !== null })
}
