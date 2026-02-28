import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const checks: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }

  // Check database
  try {
    const count = await prisma.team.count()
    checks.database = { status: 'ok', teams: count }
  } catch (e) {
    checks.database = { status: 'error', error: String(e) }
    checks.status = 'degraded'
  }

  // Check disk space for DB
  try {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    const stats = fs.statSync(dbPath)
    checks.dbSize = `${(stats.size / 1024 / 1024).toFixed(2)} MB`
  } catch {
    checks.dbSize = 'unknown'
  }

  // Check uploads directory
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads')
    if (fs.existsSync(uploadsDir)) {
      checks.uploads = { status: 'ok' }
    } else {
      checks.uploads = { status: 'missing' }
    }
  } catch {
    checks.uploads = { status: 'error' }
  }

  // Memory usage
  const mem = process.memoryUsage()
  checks.memory = {
    heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
    heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`,
    rss: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`,
  }

  const statusCode = checks.status === 'ok' ? 200 : 503
  return NextResponse.json(checks, { status: statusCode })
}
