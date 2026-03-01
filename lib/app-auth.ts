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

  return { coach, team: coach.team }
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
