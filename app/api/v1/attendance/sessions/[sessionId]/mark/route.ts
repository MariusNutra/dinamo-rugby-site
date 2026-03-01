import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCoach } from '@/lib/app-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const auth = await requireCoach(request)
  if ('error' in auth) return auth.error

  const session = await prisma.attendanceSession.findUnique({
    where: { id: params.sessionId },
  })

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.teamId !== auth.team.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const records: Array<{ childId: string; status: string }> = body.records

  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: 'records array is required' }, { status: 400 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const results = await Promise.all(
    records.map(async (record) => {
      const existing = await prisma.attendance.findFirst({
        where: {
          childId: record.childId,
          teamId: auth.team.id,
          date: { gte: today, lt: new Date(today.getTime() + 86400000) },
        },
      })

      if (existing) {
        return prisma.attendance.update({
          where: { id: existing.id },
          data: {
            present: record.status === 'present',
            sessionId: session.id,
          },
        })
      }

      return prisma.attendance.create({
        data: {
          childId: record.childId,
          date: new Date(),
          present: record.status === 'present',
          teamId: auth.team.id,
          sessionId: session.id,
          type: 'antrenament',
        },
      })
    })
  )

  return NextResponse.json({
    data: {
      marked: results.length,
      sessionId: session.id,
    },
  })
}
