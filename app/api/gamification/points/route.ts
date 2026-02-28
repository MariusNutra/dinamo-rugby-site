import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { getParentId } from '@/lib/parent-auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'
import { awardPoints, getChildPoints } from '@/lib/gamification'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')

  if (!childId) {
    return NextResponse.json({ error: 'childId este obligatoriu' }, { status: 400 })
  }

  // Check parent auth
  const parentId = await getParentId()
  if (parentId) {
    // Validate child belongs to parent
    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { parentId: true },
    })
    if (!child || child.parentId !== parentId) {
      return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
    }
    const points = await getChildPoints(childId)
    return NextResponse.json(points)
  }

  // Check admin auth
  if (await isAuthenticated()) {
    const points = await getChildPoints(childId)
    return NextResponse.json(points)
  }

  return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { childId, amount, reason } = body

  if (!childId || amount === undefined || !reason) {
    return NextResponse.json({ error: 'childId, amount si reason sunt obligatorii' }, { status: 400 })
  }

  const numAmount = parseInt(String(amount), 10)
  if (isNaN(numAmount) || numAmount === 0) {
    return NextResponse.json({ error: 'Amount trebuie sa fie un numar nenul' }, { status: 400 })
  }

  // Verify child exists
  const child = await prisma.child.findUnique({ where: { id: childId } })
  if (!child) {
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  const points = await awardPoints(childId, numAmount, String(reason).slice(0, 500))
  return NextResponse.json(points, { status: 201 })
}
