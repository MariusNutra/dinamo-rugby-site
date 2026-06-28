/**
 * Unified auth helpers for refresh token management.
 *
 * Handles creation, rotation, and revocation of refresh tokens
 * across all user types (User, Parent, Coach).
 */

import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is required')
  return secret
}

// ── Access Token (JWT, 7d) ──────────────────────────────────────────────────

interface AccessTokenPayload {
  userId?: number
  parentId?: string
  coachId?: string
  username?: string
  email?: string
  role: string
}

export function createAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

// ── Refresh Token (random hex, 30d, stored in DB) ───────────────────────────

interface CreateRefreshTokenParams {
  userId?: number
  parentId?: string
  coachId?: string
  role: string
}

export async function createRefreshToken(params: CreateRefreshTokenParams): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await prisma.refreshToken.create({
    data: {
      token,
      userId: params.userId ?? null,
      parentId: params.parentId ?? null,
      coachId: params.coachId ?? null,
      role: params.role,
      expiresAt,
    },
  })

  return token
}

// ── Rotate Refresh Token ────────────────────────────────────────────────────

interface RotateResult {
  accessToken: string
  refreshToken: string
}

export async function rotateRefreshToken(oldToken: string): Promise<RotateResult | null> {
  const record = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
  })

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    return null
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  })

  // Build access token payload
  const payload: AccessTokenPayload = { role: record.role }
  if (record.userId) payload.userId = record.userId
  if (record.parentId) payload.parentId = record.parentId
  if (record.coachId) payload.coachId = record.coachId

  // Look up email for the payload
  if (record.userId) {
    const user = await prisma.user.findUnique({ where: { id: record.userId } })
    if (!user || !user.active) return null
    payload.username = user.username
    payload.email = user.email ?? undefined
  } else if (record.parentId) {
    const parent = await prisma.parent.findUnique({ where: { id: record.parentId } })
    if (!parent) return null
    payload.email = parent.email
  } else if (record.coachId) {
    const coach = await prisma.coach.findUnique({ where: { id: record.coachId } })
    if (!coach) return null
    payload.email = coach.email ?? undefined
  }

  // Create new tokens
  const accessToken = createAccessToken(payload)
  const refreshToken = await createRefreshToken({
    userId: record.userId ?? undefined,
    parentId: record.parentId ?? undefined,
    coachId: record.coachId ?? undefined,
    role: record.role,
  })

  return { accessToken, refreshToken }
}

// ── Revoke a single refresh token ───────────────────────────────────────────

export async function revokeRefreshToken(token: string): Promise<void> {
  try {
    await prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  } catch {
    // Token may not exist, that's fine
  }
}

// ── Revoke all refresh tokens for a subject ─────────────────────────────────

interface RevokeAllParams {
  userId?: number
  parentId?: string
  coachId?: string
}

export async function revokeAllRefreshTokens(params: RevokeAllParams): Promise<void> {
  const where: Record<string, unknown> = { revokedAt: null }
  if (params.userId) where.userId = params.userId
  if (params.parentId) where.parentId = params.parentId
  if (params.coachId) where.coachId = params.coachId

  await prisma.refreshToken.updateMany({
    where,
    data: { revokedAt: new Date() },
  })
}
