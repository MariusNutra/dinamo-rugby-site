import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export interface AppTokenPayload {
  parentId?: string
  coachId?: string
  email: string
  role: string
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is required')
  return secret
}

/**
 * Verify a Bearer JWT token from the mobile app.
 * Returns the decoded payload or null if invalid.
 */
export function verifyAppToken(req: NextRequest): AppTokenPayload | null {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  try {
    return jwt.verify(authHeader.slice(7), getJwtSecret()) as AppTokenPayload
  } catch {
    return null
  }
}

/**
 * Return the set of child IDs an app token is allowed to read, or `null` for
 * admins (meaning: no restriction). Parents see their own children; coaches see
 * children on their team. Anyone else gets an empty list.
 */
export async function getAccessibleChildIds(
  payload: AppTokenPayload
): Promise<string[] | null> {
  if (payload.role === 'admin' || payload.role === 'superadmin') return null

  if (payload.parentId) {
    const children = await prisma.child.findMany({
      where: { parentId: payload.parentId },
      select: { id: true },
    })
    return children.map((c) => c.id)
  }

  if (payload.coachId) {
    const coach = await prisma.coach.findUnique({
      where: { id: payload.coachId },
      select: { teamId: true },
    })
    if (!coach?.teamId) return []
    const children = await prisma.child.findMany({
      where: { teamId: coach.teamId },
      select: { id: true },
    })
    return children.map((c) => c.id)
  }

  return []
}

/**
 * Check whether an app token may access a single child's data.
 */
export async function canAccessChild(
  payload: AppTokenPayload,
  childId: string
): Promise<boolean> {
  if (!childId) return false
  const ids = await getAccessibleChildIds(payload)
  if (ids === null) return true // admin
  return ids.includes(childId)
}

/**
 * Require a coach JWT. Returns the Coach (with team) or a 401 response.
 */
export async function requireCoach(req: NextRequest) {
  const payload = verifyAppToken(req)
  if (!payload?.coachId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const coach = await prisma.coach.findUnique({
    where: { id: payload.coachId },
    include: { team: true },
  })

  if (!coach) {
    return { error: NextResponse.json({ error: 'Coach not found' }, { status: 401 }) }
  }

  return { coach, team: coach.team ?? null }
}

/**
 * Require an athlete JWT (parentId → first Child). Returns the Child (with team) or a 401 response.
 */
export async function requireAthlete(req: NextRequest) {
  const payload = verifyAppToken(req)
  if (!payload?.parentId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const child = await prisma.child.findFirst({
    where: { parentId: payload.parentId },
    include: { team: true },
  })

  if (!child) {
    return { error: NextResponse.json({ error: 'Athlete not found' }, { status: 401 }) }
  }

  return { child, team: child.team }
}
