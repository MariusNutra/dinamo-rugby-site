import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'
import { isDinamoTeam } from '@/lib/teams'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authz = await requirePermission('matches.manage')
  if (authz.error) return authz.error
  const data = await req.json()

  const updateData: Record<string, unknown> = {}
  if (data.category !== undefined) updateData.category = data.category
  if (data.matchType !== undefined) updateData.matchType = data.matchType
  if (data.round !== undefined) updateData.round = data.round || null
  if (data.date !== undefined) updateData.date = new Date(data.date)
  if (data.location !== undefined) updateData.location = data.location || null
  if (data.homeTeam !== undefined) updateData.homeTeam = data.homeTeam
  if (data.awayTeam !== undefined) updateData.awayTeam = data.awayTeam
  if (data.homeScore !== undefined) updateData.homeScore = data.homeScore !== '' && data.homeScore != null ? parseInt(data.homeScore) : null
  if (data.awayScore !== undefined) updateData.awayScore = data.awayScore !== '' && data.awayScore != null ? parseInt(data.awayScore) : null
  if (data.notes !== undefined) updateData.notes = data.notes || null

  // Auto-detect isDinamo if teams changed
  if (data.homeTeam !== undefined || data.awayTeam !== undefined) {
    const existing = await prisma.match.findUnique({ where: { id: params.id } })
    const home = data.homeTeam ?? existing?.homeTeam ?? ''
    const away = data.awayTeam ?? existing?.awayTeam ?? ''
    updateData.isDinamo = isDinamoTeam(home) || isDinamoTeam(away)
  }
  if (data.isDinamo !== undefined) updateData.isDinamo = data.isDinamo

  const match = await prisma.match.update({
    where: { id: params.id },
    data: updateData,
  })
  return NextResponse.json(match)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authz = await requirePermission('matches.manage')
  if (authz.error) return authz.error
  await prisma.match.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
