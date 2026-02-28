import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const donations = await prisma.donation.findMany({
    where: { campaignId: params.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(donations)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { donorName, email, amount, anonymous } = body

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'Suma trebuie sa fie un numar pozitiv' }, { status: 400 })
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } })
  if (!campaign) {
    return NextResponse.json({ error: 'Campanie negasita' }, { status: 404 })
  }

  const donation = await prisma.donation.create({
    data: {
      campaignId: params.id,
      donorName: donorName ? String(donorName).slice(0, 200) : null,
      email: email ? String(email).slice(0, 200) : null,
      amount,
      anonymous: anonymous ?? false,
      paymentMethod: 'manual',
      status: 'completed',
    },
  })

  await prisma.campaign.update({
    where: { id: params.id },
    data: { currentAmount: { increment: amount } },
  })

  return NextResponse.json(donation, { status: 201 })
}
