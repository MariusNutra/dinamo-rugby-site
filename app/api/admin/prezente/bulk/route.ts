import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function POST(req: NextRequest) {
  const authz = await requirePermission('attendance.manage')
  if (authz.error) return authz.error

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { date, type, teamId, attendances } = body

  if (!date || !teamId || !Array.isArray(attendances)) {
    return NextResponse.json({ error: 'Date incomplete: date, teamId si attendances sunt obligatorii' }, { status: 400 })
  }

  const attDate = new Date(date as string)
  const startOfDay = new Date(attDate.getFullYear(), attDate.getMonth(), attDate.getDate())
  const endOfDay = new Date(attDate.getFullYear(), attDate.getMonth(), attDate.getDate() + 1)

  await prisma.$transaction(async (tx) => {
    // Delete existing attendance for this team and date
    await tx.attendance.deleteMany({
      where: {
        teamId: Number(teamId),
        date: { gte: startOfDay, lt: endOfDay },
        type: (type as string) || 'antrenament',
      },
    })

    // Create new attendance records
    await tx.attendance.createMany({
      data: attendances.map((att: { childId: string; present: boolean; notes?: string }) => ({
        childId: att.childId,
        date: startOfDay,
        type: (type as string) || 'antrenament',
        present: att.present,
        notes: att.notes || null,
        teamId: Number(teamId),
      })),
    })
  })

  return NextResponse.json({ success: true, count: attendances.length }, { status: 201 })
}
