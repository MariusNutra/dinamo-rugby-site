import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function GET() {
  const authz = await requirePermission('athletes.view')
  if (authz.error) return authz.error

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  const [evaluariLuna, prezenteAzi, medicalActiv] = await Promise.all([
    prisma.evaluation.count({
      where: { date: { gte: startOfMonth } },
    }),
    prisma.attendance.count({
      where: { date: { gte: startOfDay, lt: endOfDay } },
    }),
    prisma.medicalRecord.count({
      where: { resolved: false },
    }),
  ])

  return NextResponse.json({
    evaluariLuna,
    prezenteAzi,
    medicalActiv,
  })
}
