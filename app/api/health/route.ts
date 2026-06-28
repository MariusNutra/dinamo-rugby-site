import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function GET() {
  // Always probe the DB so the status code is meaningful for monitoring.
  let dbOk = true
  let dbError: string | null = null
  let teamCount = 0
  try {
    teamCount = await prisma.team.count()
  } catch (e) {
    dbOk = false
    dbError = String(e)
  }

  const status = dbOk ? 'ok' : 'degraded'
  const statusCode = dbOk ? 200 : 503

  // Public response: only liveness, no internals (uptime/memory/paths/errors).
  if (!(await isAdmin())) {
    return NextResponse.json(
      { status, timestamp: new Date().toISOString() },
      { status: statusCode }
    )
  }

  // Detailed diagnostics for authenticated admins only.
  const checks: Record<string, unknown> = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbOk ? { status: 'ok', teams: teamCount } : { status: 'error', error: dbError },
  }

  try {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    const stats = fs.statSync(dbPath)
    checks.dbSize = `${(stats.size / 1024 / 1024).toFixed(2)} MB`
  } catch {
    checks.dbSize = 'unknown'
  }

  try {
    const uploadsDir = path.join(process.cwd(), 'uploads')
    checks.uploads = { status: fs.existsSync(uploadsDir) ? 'ok' : 'missing' }
  } catch {
    checks.uploads = { status: 'error' }
  }

  const mem = process.memoryUsage()
  checks.memory = {
    heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
    heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`,
    rss: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`,
  }

  return NextResponse.json(checks, { status: statusCode })
}
