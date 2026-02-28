import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { getParentId } from '@/lib/parent-auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'
import { getChildBadges } from '@/lib/gamification'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')

  // If childId is provided, could be parent request
  if (childId) {
    // Check parent auth first
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
      const badges = await getChildBadges(childId)
      return NextResponse.json(badges)
    }

    // Check admin auth
    if (await isAuthenticated()) {
      const badges = await getChildBadges(childId)
      return NextResponse.json(badges)
    }

    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  // No childId: admin list all badges
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const badges = await prisma.badge.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { athletes: true } },
    },
  })

  return NextResponse.json(badges)
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { name, icon, description, criteria, category, active } = body

  if (!name) {
    return NextResponse.json({ error: 'Numele este obligatoriu' }, { status: 400 })
  }

  // Validate criteria JSON
  let criteriaStr = '{}'
  if (criteria) {
    try {
      if (typeof criteria === 'string') {
        JSON.parse(criteria)
        criteriaStr = criteria
      } else {
        criteriaStr = JSON.stringify(criteria)
      }
    } catch {
      return NextResponse.json({ error: 'Criteriu invalid (JSON)' }, { status: 400 })
    }
  }

  const badge = await prisma.badge.create({
    data: {
      name: String(name).slice(0, 200),
      icon: icon ? String(icon).slice(0, 10) : undefined,
      description: description ? String(description).slice(0, 1000) : null,
      criteria: criteriaStr,
      category: category ? String(category).slice(0, 50) : 'general',
      active: active !== undefined ? Boolean(active) : true,
    },
  })

  return NextResponse.json(badge, { status: 201 })
}
