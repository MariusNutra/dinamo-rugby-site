import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authz'
import { validateCsrf, setCsrfCookie } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

const BRANDING_FIELDS = {
  logo: true,
  primaryColor: true,
  secondaryColor: true,
  accentColor: true,
  fontFamily: true,
  heroTitle: true,
  heroSubtitle: true,
  clubName: true,
  clubAddress: true,
  clubPhone: true,
  clubEmail: true,
  favicon: true,
  ogImage: true,
  updatedAt: true,
} as const

const VALID_KEYS = [
  'logo',
  'primaryColor',
  'secondaryColor',
  'accentColor',
  'fontFamily',
  'heroTitle',
  'heroSubtitle',
  'clubName',
  'clubAddress',
  'clubPhone',
  'clubEmail',
  'favicon',
  'ogImage',
] as const

const VALID_FONTS = ['Montserrat', 'Inter', 'Roboto', 'Poppins', 'Open Sans', 'Lato']

function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

export async function GET() {
  const authz = await requirePermission('settings.manage')
  if (authz.error) return authz.error

  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
    select: BRANDING_FIELDS,
  })

  const response = NextResponse.json(settings)
  return setCsrfCookie(response)
}

export async function PUT(req: NextRequest) {
  const authz = await requirePermission('settings.manage')
  if (authz.error) return authz.error

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const updateData: Record<string, unknown> = {}

  for (const key of VALID_KEYS) {
    if (!(key in body)) continue

    const value = body[key]

    // Color fields validation
    if (key === 'primaryColor' || key === 'secondaryColor' || key === 'accentColor') {
      if (typeof value === 'string' && isValidHexColor(value)) {
        updateData[key] = value
      }
      continue
    }

    // Font family validation
    if (key === 'fontFamily') {
      if (typeof value === 'string' && VALID_FONTS.includes(value)) {
        updateData[key] = value
      }
      continue
    }

    // String fields (nullable)
    if (value === null || value === '') {
      updateData[key] = null
    } else if (typeof value === 'string') {
      updateData[key] = value.trim().slice(0, 500)
    }
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: updateData,
    create: { id: 1, ...updateData },
    select: BRANDING_FIELDS,
  })

  return NextResponse.json(settings)
}
