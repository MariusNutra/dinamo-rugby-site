import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { evaluations, period, date } = body

  if (!Array.isArray(evaluations) || evaluations.length === 0) {
    return NextResponse.json({ error: 'Lista de evaluari este goala' }, { status: 400 })
  }

  if (!period) {
    return NextResponse.json({ error: 'Perioada este obligatorie' }, { status: 400 })
  }

  const evalDate = date ? new Date(date as string) : new Date()

  const created = await prisma.$transaction(
    evaluations.map((ev: { childId: string; physical: number; technical: number; tactical: number; mental: number; social: number; comments?: string }) =>
      prisma.evaluation.create({
        data: {
          childId: ev.childId,
          period: period as string,
          physical: Number(ev.physical),
          technical: Number(ev.technical),
          tactical: Number(ev.tactical),
          mental: Number(ev.mental),
          social: Number(ev.social),
          comments: ev.comments || null,
          date: evalDate,
        },
      })
    )
  )

  return NextResponse.json({ success: true, count: created.length }, { status: 201 })
}
