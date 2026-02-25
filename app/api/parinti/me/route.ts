import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function GET() {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    include: {
      children: {
        include: { team: { select: { id: true, grupa: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!parent) {
    return NextResponse.json({ error: 'Parinte negasit' }, { status: 404 })
  }

  // Fetch sportiv mini-stats per child
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const childrenWithStats = await Promise.all(
    parent.children.map(async (c) => {
      const [attendances, lastEval] = await Promise.all([
        prisma.attendance.findMany({
          where: { childId: c.id, date: { gte: startOfMonth } },
        }),
        prisma.evaluation.findFirst({
          where: { childId: c.id },
          orderBy: { date: 'desc' },
        }),
      ])

      const attTotal = attendances.length
      const attPresent = attendances.filter(a => a.present).length

      return {
        id: c.id,
        name: c.name,
        birthYear: c.birthYear,
        teamId: c.teamId,
        teamName: c.team?.grupa ?? null,
        photoConsent: c.photoConsent,
        photoConsentWA: c.photoConsentWA,
        photoConsentDate: c.photoConsentDate,
        signatureData: c.signatureData ? true : false,
        medicalCert: c.medicalCert,
        sportivStats: {
          attendancePercent: attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0,
          lastEvalAvg: lastEval ? (lastEval.physical + lastEval.technical + lastEval.tactical + lastEval.mental + lastEval.social) / 5 : null,
          lastEvalDate: lastEval?.date?.toISOString() ?? null,
        },
      }
    })
  )

  return NextResponse.json({
    id: parent.id,
    name: parent.name,
    email: parent.email,
    phone: parent.phone,
    children: childrenWithStats,
  })
}

export async function PATCH(req: NextRequest) {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { phone } = body

  if (phone !== undefined && phone !== null) {
    if (typeof phone !== 'string') {
      return NextResponse.json({ error: 'Numarul de telefon este invalid.' }, { status: 400 })
    }
    if (phone.length > 20) {
      return NextResponse.json({ error: 'Numarul de telefon este prea lung.' }, { status: 400 })
    }
  }

  const parent = await prisma.parent.update({
    where: { id: parentId },
    data: {
      phone: phone ? (phone as string).trim() : null,
    },
  })

  return NextResponse.json({
    success: true,
    phone: parent.phone,
  })
}
