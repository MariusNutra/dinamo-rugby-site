import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const authz = await requirePermission('athletes.view')
  if (authz.error) return authz.error

  try {
    const { childId } = await params
    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { publicProfile: true, publicBio: true },
    })
    if (!child) {
      return NextResponse.json({ error: 'Negăsit' }, { status: 404 })
    }
    return NextResponse.json(child)
  } catch (error) {
    console.error('Failed to get public profile:', error)
    return NextResponse.json({ error: 'Eroare' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const authz = await requirePermission('athletes.manage')
  if (authz.error) return authz.error

  try {
    const { childId } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}

    if (typeof body.publicProfile === 'boolean') {
      data.publicProfile = body.publicProfile
    }
    if (body.publicBio !== undefined) {
      data.publicBio = body.publicBio
    }

    const updated = await prisma.child.update({
      where: { id: childId },
      data,
      select: { publicProfile: true, publicBio: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update public profile:', error)
    return NextResponse.json({ error: 'Eroare' }, { status: 500 })
  }
}
