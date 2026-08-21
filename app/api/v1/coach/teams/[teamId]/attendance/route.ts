import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCoach } from '@/lib/app-auth'
import { generateQRToken } from '@/lib/qr'
import { startOfDay, nextDay as dayAfter } from '@/lib/day'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const auth = await requireCoach(request)
  if ('error' in auth) return auth.error

  const teamId = parseInt(params.teamId)
  if (!auth.team || auth.team.id !== teamId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  let targetDate: Date
  try {
    targetDate = startOfDay(url.searchParams.get('date'))
  } catch {
    return NextResponse.json({ error: 'Data invalida' }, { status: 400 })
  }
  const nextDay = dayAfter(targetDate)

  // Find or create session for this team + date
  let session = await prisma.attendanceSession.findFirst({
    where: {
      teamId,
      date: { gte: targetDate, lt: nextDay },
    },
  })

  if (!session) {
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)
    session = await prisma.attendanceSession.create({
      data: {
        teamId,
        qrToken: generateQRToken(),
        expiresAt: endOfDay,
        date: targetDate,
      },
    })
  }

  // Get all children and their attendance for that date
  const children = await prisma.child.findMany({
    where: { teamId },
    orderBy: { name: 'asc' },
  })

  const attendances = await prisma.attendance.findMany({
    where: {
      teamId,
      date: { gte: targetDate, lt: nextDay },
    },
  })

  const attendanceMap = new Map(
    attendances.map((a) => [a.childId, a.present ? 'present' : 'absent'])
  )

  // Anuntul familiei pentru ziua asta. E separat de prezenta: spune pe cine
  // asteptam, nu cine a venit.
  const intents = await prisma.participationIntent.findMany({
    where: {
      date: targetDate,
      childId: { in: children.map((c) => c.id) },
    },
  })
  const intentMap = new Map(intents.map((i) => [i.childId, i]))

  return NextResponse.json({
    data: {
      sessionId: session.id,
      date: targetDate.toISOString(),
      players: children.map((c) => {
        const intent = intentMap.get(c.id)
        return {
          childId: c.id,
          name: c.name,
          status: attendanceMap.get(c.id) || 'unmarked',
          // 'yes' | 'no' | null — null inseamna ca familia n-a anuntat nimic.
          announced: intent ? (intent.attending ? 'yes' : 'no') : null,
          announcedNote: intent?.note ?? null,
        }
      }),
    },
  })
}
