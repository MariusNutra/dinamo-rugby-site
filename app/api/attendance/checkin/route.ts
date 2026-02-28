import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

// POST - Check in a child via QR token
export async function POST(req: NextRequest) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const { qrToken, childId } = await req.json()

    if (!qrToken || !childId) {
      return NextResponse.json({ error: 'qrToken și childId sunt obligatorii' }, { status: 400 })
    }

    // Validate session
    const session = await prisma.attendanceSession.findUnique({
      where: { qrToken },
      include: { team: { select: { id: true, grupa: true } } },
    })

    if (!session) {
      return NextResponse.json({ error: 'Cod QR invalid' }, { status: 404 })
    }

    if (new Date() > session.expiresAt) {
      return NextResponse.json({ error: 'Sesiunea a expirat' }, { status: 410 })
    }

    // Validate child belongs to parent and to the right team
    const child = await prisma.child.findFirst({
      where: { id: childId, parentId },
    })

    if (!child) {
      return NextResponse.json({ error: 'Copilul nu a fost găsit' }, { status: 404 })
    }

    if (child.teamId !== session.teamId) {
      return NextResponse.json({ error: 'Copilul nu face parte din această echipă' }, { status: 400 })
    }

    // Check for duplicate checkin today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existing = await prisma.attendance.findFirst({
      where: {
        childId,
        sessionId: session.id,
      },
    })

    if (existing) {
      return NextResponse.json({
        message: 'Prezența a fost deja înregistrată',
        alreadyCheckedIn: true,
        checkinTime: existing.checkinTime?.toISOString() || existing.createdAt.toISOString(),
      })
    }

    // Record attendance
    const attendance = await prisma.attendance.create({
      data: {
        childId,
        date: new Date(),
        type: 'antrenament',
        present: true,
        teamId: session.teamId,
        checkinTime: new Date(),
        sessionId: session.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Prezență înregistrată cu succes!',
      childName: child.name,
      teamName: session.team.grupa,
      checkinTime: attendance.checkinTime?.toISOString(),
    })
  } catch (error) {
    console.error('Checkin error:', error)
    return NextResponse.json({ error: 'Eroare la înregistrarea prezenței' }, { status: 500 })
  }
}
