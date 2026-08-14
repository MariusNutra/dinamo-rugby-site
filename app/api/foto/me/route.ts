import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPhotographerId } from '@/lib/photographer-auth'

export async function GET() {
  const id = await getPhotographerId()
  if (id === null) {
    return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, username: true, email: true },
  })

  return NextResponse.json(user)
}
