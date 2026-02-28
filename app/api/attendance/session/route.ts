import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { generateQRToken } from '@/lib/qr'

// POST - Create a new QR attendance session
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const { teamId, durationMinutes = 120 } = await req.json()

    if (!teamId) {
      return NextResponse.json({ error: 'teamId este obligatoriu' }, { status: 400 })
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return NextResponse.json({ error: 'Echipa nu există' }, { status: 404 })
    }

    const qrToken = generateQRToken()
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000)

    const session = await prisma.attendanceSession.create({
      data: {
        teamId,
        qrToken,
        expiresAt,
      },
      include: { team: { select: { grupa: true } } },
    })

    return NextResponse.json({
      id: session.id,
      qrToken: session.qrToken,
      teamName: session.team.grupa,
      expiresAt: session.expiresAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Failed to create attendance session:', error)
    return NextResponse.json({ error: 'Eroare la crearea sesiunii' }, { status: 500 })
  }
}

// GET - List active sessions
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
      include: { team: { select: { grupa: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(sessions.map(s => ({
      id: s.id,
      qrToken: s.qrToken,
      teamName: s.team.grupa,
      teamId: s.teamId,
      expiresAt: s.expiresAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
    })))
  } catch (error) {
    console.error('Failed to list sessions:', error)
    return NextResponse.json({ error: 'Eroare' }, { status: 500 })
  }
}
