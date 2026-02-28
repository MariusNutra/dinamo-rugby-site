import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'
import { checkAndAwardBadges } from '@/lib/gamification'

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { childId } = body

  if (!childId) {
    return NextResponse.json({ error: 'childId este obligatoriu' }, { status: 400 })
  }

  // If childId is "all", check all children
  if (childId === 'all') {
    const children = await prisma.child.findMany({ select: { id: true } })
    const allResults: { childId: string; newBadges: { badgeId: string; name: string; icon: string }[] }[] = []

    for (const child of children) {
      const newBadges = await checkAndAwardBadges(child.id)
      if (newBadges.length > 0) {
        allResults.push({ childId: child.id, newBadges })
      }
    }

    return NextResponse.json({
      checked: children.length,
      awarded: allResults.reduce((sum, r) => sum + r.newBadges.length, 0),
      results: allResults,
    })
  }

  // Single child
  const child = await prisma.child.findUnique({ where: { id: childId } })
  if (!child) {
    return NextResponse.json({ error: 'Copil negasit' }, { status: 404 })
  }

  const newBadges = await checkAndAwardBadges(childId)
  return NextResponse.json({
    checked: 1,
    awarded: newBadges.length,
    newBadges,
  })
}
