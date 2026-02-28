import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const campaigns = await prisma.campaign.findMany({
    include: {
      _count: { select: { donations: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(campaigns)
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { title, description, image, goalAmount, deadline, showDonors, allowAnonymous } = body

  if (!title || !description || !goalAmount) {
    return NextResponse.json({ error: 'Titlul, descrierea si obiectivul sunt obligatorii' }, { status: 400 })
  }

  if (typeof goalAmount !== 'number' || goalAmount <= 0) {
    return NextResponse.json({ error: 'Obiectivul trebuie sa fie un numar pozitiv' }, { status: 400 })
  }

  const campaign = await prisma.campaign.create({
    data: {
      title: String(title).slice(0, 200),
      description: String(description).slice(0, 5000),
      image: image ? String(image) : null,
      goalAmount,
      deadline: deadline ? new Date(deadline) : null,
      showDonors: showDonors ?? true,
      allowAnonymous: allowAnonymous ?? true,
    },
  })

  return NextResponse.json(campaign, { status: 201 })
}
