import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { headers } from 'next/headers'

interface AuditEntry {
  action: 'create' | 'update' | 'delete'
  entity: string
  entityId?: string
  details?: string
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    const user = await getAuthUser()
    const hdrs = await headers()
    const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || null

    await prisma.auditLog.create({
      data: {
        userId: user?.userId ?? null,
        username: user?.username ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        details: entry.details ?? null,
        ip,
      },
    })
  } catch (error) {
    console.error('Audit log failed:', error)
  }
}
