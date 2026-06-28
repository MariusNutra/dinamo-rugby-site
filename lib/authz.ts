import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { hasPermission, type Permission } from '@/lib/permissions'

/**
 * Server-side authorization guards for the admin panel API.
 *
 * Usage in a route handler:
 *   const authz = await requirePermission('athletes.manage')
 *   if (authz.error) return authz.error
 *   // authz.user is the authenticated admin-panel user
 *
 * Legacy 'admin'/'superadmin' roles implicitly hold every permission, so
 * existing single-admin setups keep working. Other roles are granted access
 * only for the permissions in their Role (or DEFAULT_ROLES) — see lib/permissions.
 */

export interface AuthUser {
  userId: number
  username: string
  role: string
}

type AuthzResult =
  | { user: AuthUser; error?: undefined }
  | { user?: undefined; error: NextResponse }

function unauthorized(): { error: NextResponse } {
  return { error: NextResponse.json({ error: 'Neautorizat' }, { status: 401 }) }
}

function forbidden(): { error: NextResponse } {
  return { error: NextResponse.json({ error: 'Acces interzis' }, { status: 403 }) }
}

/** Require any authenticated admin-panel user (no specific permission). */
export async function requireUser(): Promise<AuthzResult> {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  return { user }
}

/** Require admin/superadmin — for user, role and API-key management. */
export async function requireAdmin(): Promise<AuthzResult> {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  if (user.role !== 'admin' && user.role !== 'superadmin') return forbidden()
  return { user }
}

/** Require the user to hold a specific permission. */
export async function requirePermission(permission: Permission): Promise<AuthzResult> {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  // Legacy super-roles bypass the permission table.
  if (user.role === 'admin' || user.role === 'superadmin') return { user }
  if (await hasPermission(user.userId, permission)) return { user }
  return forbidden()
}
