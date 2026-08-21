import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAppToken, canAccessChild } from '@/lib/app-auth'
import { startOfDay, normalizeWeekday, weekdayOf } from '@/lib/day'

/**
 * Anuntul de participare la antrenament.
 *
 * NU e prezenta. Prezenta se ia la teren, cu QR, de catre antrenor
 * (`/api/attendance/checkin` + `/api/v1/attendance/sessions/[id]/mark`).
 * Aici parintele doar spune daca vine copilul, ca antrenorul sa stie
 * pe cine pune la socoteala. Cele doua nu se amesteca niciodata.
 */

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

// GET /api/v1/attendance/intent?childId=...&date=YYYY-MM-DD
// Fara `date`, intoarce anuntul de azi.
export async function GET(request: NextRequest) {
  const payload = verifyAppToken(request)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const childId = url.searchParams.get('childId')
  if (!childId) {
    return NextResponse.json({ error: 'childId este obligatoriu' }, { status: 400 })
  }

  if (!(await canAccessChild(payload, childId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let day: Date
  try {
    day = startOfDay(url.searchParams.get('date'))
  } catch {
    return NextResponse.json({ error: 'Data invalida' }, { status: 400 })
  }

  const [intent, child] = await Promise.all([
    prisma.participationIntent.findUnique({
      where: { childId_date: { childId, date: day } },
    }),
    prisma.child.findUnique({
      where: { id: childId },
      include: { team: { select: { grupa: true } } },
    }),
  ])

  // Programul de antrenamente e saptamanal si e tinut pe grupa („U10", „Marti
  // 19:00"), nu in calendarul de evenimente — calendarul e pentru meciuri.
  // Ecranul intreba inainte calendarul, care e gol, deci nu aparea niciodata.
  let training = null
  if (child?.team?.grupa) {
    const sessions = await prisma.trainingSession.findMany({
      where: { grupa: child.team.grupa },
    })
    const wanted = weekdayOf(day)
    const match = sessions.find((t) => normalizeWeekday(t.day) === wanted)
    if (match) {
      training = {
        day: match.day,
        startTime: match.startTime,
        endTime: match.endTime,
        location: match.location,
        coachName: match.coachName,
      }
    }
  }

  return NextResponse.json({
    data: {
      date: day.toISOString(),
      hasTraining: training !== null,
      training,
      intent: intent
        ? {
            attending: intent.attending,
            note: intent.note,
            announcedAt: intent.updatedAt.toISOString(),
          }
        : null,
    },
  })
}

// POST /api/v1/attendance/intent  { childId, date?, attending?, note? }
export async function POST(request: NextRequest) {
  const payload = verifyAppToken(request)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { childId?: string; date?: string; attending?: boolean; note?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const childId = body.childId
  if (!childId) {
    return NextResponse.json({ error: 'childId este obligatoriu' }, { status: 400 })
  }

  // Antrenorul vede copiii echipei, dar anuntul il face familia. Daca lasam
  // `canAccessChild` singur, un antrenor ar putea anunta in locul parintelui.
  if (!payload.parentId) {
    return NextResponse.json(
      { error: 'Doar parintele sau sportivul pot anunta participarea' },
      { status: 403 }
    )
  }

  if (!(await canAccessChild(payload, childId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let day: Date
  try {
    day = startOfDay(body.date)
  } catch {
    return NextResponse.json({ error: 'Data invalida' }, { status: 400 })
  }

  // Anuntul are sens doar inainte; pentru zilele trecute conteaza prezenta reala.
  if (day < startOfDay()) {
    return NextResponse.json(
      { error: 'Poti anunta doar pentru azi sau pentru o zi viitoare' },
      { status: 400 }
    )
  }

  const attending = body.attending !== false
  const note = typeof body.note === 'string' ? body.note.slice(0, 300) : null
  const source = payload.role === 'athlete' ? 'athlete' : 'parent'

  const intent = await prisma.participationIntent.upsert({
    where: { childId_date: { childId, date: day } },
    create: { childId, date: day, attending, note, source },
    update: { attending, note, source },
  })

  return NextResponse.json({
    data: {
      date: intent.date.toISOString(),
      intent: {
        attending: intent.attending,
        note: intent.note,
        announcedAt: intent.updatedAt.toISOString(),
      },
    },
  })
}
