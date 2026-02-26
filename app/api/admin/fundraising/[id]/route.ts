import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      donations: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!campaign) {
    return NextResponse.json({ error: 'Campanie negasita' }, { status: 404 })
  }

  return NextResponse.json(campaign)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { title, description, image, goalAmount, deadline, active, showDonors, allowAnonymous } = body

  const campaign = await prisma.campaign.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title: String(title).slice(0, 200) }),
      ...(description !== undefined && { description: String(description).slice(0, 5000) }),
      ...(image !== undefined && { image }),
      ...(goalAmount !== undefined && { goalAmount }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(active !== undefined && { active }),
      ...(showDonors !== undefined && { showDonors }),
      ...(allowAnonymous !== undefined && { allowAnonymous }),
    },
  })

  return NextResponse.json(campaign)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  await prisma.campaign.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
