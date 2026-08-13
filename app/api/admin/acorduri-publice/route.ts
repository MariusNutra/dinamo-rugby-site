import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

/** Acordurile venite prin linkul public. Doar citire. */
export async function GET() {
  const authz = await requirePermission('athletes.view')
  if (authz.error) return authz.error

  const acorduri = await prisma.acordFoto.findMany({
    orderBy: { createdAt: 'desc' },
    include: { copii: { orderBy: { nume: 'asc' } } },
  })

  return NextResponse.json(acorduri)
}
