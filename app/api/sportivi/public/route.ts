import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - List athletes with public profiles
export async function GET() {
  try {
    const children = await prisma.child.findMany({
      where: {
        publicProfile: true,
        parent: {
          children: {
            some: { photoConsent: true },
          },
        },
      },
      select: {
        id: true,
        name: true,
        birthYear: true,
        publicBio: true,
        team: {
          select: { id: true, grupa: true },
        },
        childPhotos: {
          select: { url: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            attendances: { where: { present: true } },
            evaluations: true,
          },
        },
      },
      orderBy: [{ team: { sortOrder: 'asc' } }, { name: 'asc' }],
    })

    return NextResponse.json(children.map(c => ({
      id: c.id,
      name: c.name,
      birthYear: c.birthYear,
      bio: c.publicBio,
      teamName: c.team?.grupa || null,
      teamId: c.team?.id || null,
      photo: c.childPhotos[0]?.url || null,
      attendanceCount: c._count.attendances,
      evaluationCount: c._count.evaluations,
    })))
  } catch (error) {
    console.error('Failed to fetch public athletes:', error)
    return NextResponse.json({ error: 'Eroare' }, { status: 500 })
  }
}
