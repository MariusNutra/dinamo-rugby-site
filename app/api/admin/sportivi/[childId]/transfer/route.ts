import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authz'
import { transferChild } from '@/lib/transfer'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const authz = await requirePermission('athletes.manage')
  if (authz.error) return authz.error

  const { childId } = await params

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { toTeamId, reason } = body as { toTeamId?: unknown; reason?: unknown }

  try {
    const result = await transferChild({
      childId,
      toTeamId:
        toTeamId === null || toTeamId === undefined ? null : Number(toTeamId),
      reason: typeof reason === 'string' ? reason : null,
      movedBy: authz.user.username,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      child: result.child,
      transferLog: result.transferLog,
      emailSent: result.emailSent,
    })
  } catch (error) {
    console.error('Eroare la transferul sportivului:', error)
    return NextResponse.json({ error: 'Eroare la transferul sportivului' }, { status: 500 })
  }
}
