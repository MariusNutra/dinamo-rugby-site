import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function GET() {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const requests = await prisma.request.findMany({
    where: { parentId },
    include: {
      child: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(requests)
}

export async function POST(req: NextRequest) {
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

  const { type, title, description, childId, startDate, endDate } = body

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Titlul este obligatoriu' }, { status: 400 })
  }

  const validTypes = ['absenta', 'transfer', 'echipament', 'alta']
  if (type && !validTypes.includes(type as string)) {
    return NextResponse.json({ error: 'Tip invalid' }, { status: 400 })
  }

  // Validate childId belongs to this parent
  if (childId) {
    const child = await prisma.child.findFirst({
      where: { id: childId as string, parentId },
    })
    if (!child) {
      return NextResponse.json({ error: 'Copilul nu a fost gasit' }, { status: 400 })
    }
  }

  const request = await prisma.request.create({
    data: {
      parentId,
      type: (type as string) || 'absenta',
      title: (title as string).trim(),
      description: description ? (description as string).trim() : null,
      childId: childId ? (childId as string) : null,
      startDate: startDate ? new Date(startDate as string) : null,
      endDate: endDate ? new Date(endDate as string) : null,
    },
    include: {
      child: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(request, { status: 201 })
}
