import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const apiKeys = await prisma.apiKey.findMany({
    orderBy: { createdAt: 'desc' },
  })

  // Parse permissions JSON for each key
  const data = apiKeys.map((key) => ({
    ...key,
    permissions: (() => {
      try {
        const parsed = JSON.parse(key.permissions)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    })(),
  }))

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { name, rateLimitPerMinute, permissions } = body

  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: 'Numele este obligatoriu' }, { status: 400 })
  }

  // Generate key with drb_ prefix
  const rawKey = randomBytes(32).toString('hex')
  const key = `drb_${rawKey}`

  // Validate permissions
  const validEndpoints = ['teams', 'matches', 'calendar', 'standings', 'athletes']
  let permArray: string[] = []
  if (Array.isArray(permissions)) {
    permArray = permissions.filter((p: string) => validEndpoints.includes(p))
  }

  const apiKey = await prisma.apiKey.create({
    data: {
      name: String(name).trim().slice(0, 200),
      key,
      rateLimitPerMinute: rateLimitPerMinute ? Math.max(1, Math.min(1000, Number(rateLimitPerMinute))) : 60,
      permissions: JSON.stringify(permArray),
      active: true,
    },
  })

  return NextResponse.json({
    ...apiKey,
    permissions: permArray,
  }, { status: 201 })
}
