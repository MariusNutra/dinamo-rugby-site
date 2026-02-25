import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function GET(req: NextRequest, { params }: { params: { childId: string } }) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const child = await prisma.child.findUnique({
    where: { id: params.childId },
    include: {
      team: { select: { id: true, grupa: true } },
      physicalProfiles: { orderBy: { date: 'desc' }, take: 1 },
      evaluations: { orderBy: { date: 'desc' }, take: 1 },
      medicalRecords: { where: { resolved: false }, orderBy: { date: 'desc' } },
    },
  })

  if (!child || child.parentId !== parentId) {
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  // Get attendance stats for current month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const attendances = await prisma.attendance.findMany({
    where: { childId: params.childId, date: { gte: startOfMonth } },
  })
  const totalAtt = attendances.length
  const presentAtt = attendances.filter(a => a.present).length

  return NextResponse.json({
    id: child.id,
    name: child.name,
    birthYear: child.birthYear,
    teamName: child.team?.grupa ?? null,
    photoConsent: child.photoConsent,
    latestProfile: child.physicalProfiles[0] || null,
    latestEvaluation: child.evaluations[0] || null,
    activeMedical: child.medicalRecords,
    attendanceMonth: {
      total: totalAtt,
      present: presentAtt,
      percent: totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0,
    },
  })
}
