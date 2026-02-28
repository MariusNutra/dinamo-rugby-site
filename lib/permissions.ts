import { prisma } from '@/lib/prisma'

export const PERMISSIONS = {
  // Conținut
  'stories.view': 'Vizualizare povești',
  'stories.manage': 'Gestionare povești',
  'gallery.view': 'Vizualizare galerie',
  'gallery.manage': 'Gestionare galerie',
  // Sport
  'teams.view': 'Vizualizare echipe',
  'teams.manage': 'Gestionare echipe',
  'athletes.view': 'Vizualizare sportivi',
  'athletes.manage': 'Gestionare sportivi',
  'attendance.view': 'Vizualizare prezențe',
  'attendance.manage': 'Gestionare prezențe',
  'evaluations.view': 'Vizualizare evaluări',
  'evaluations.manage': 'Gestionare evaluări',
  'matches.view': 'Vizualizare meciuri',
  'matches.manage': 'Gestionare meciuri',
  'competitions.manage': 'Gestionare competiții',
  // Utilizatori
  'parents.view': 'Vizualizare părinți',
  'parents.manage': 'Gestionare părinți',
  'requests.manage': 'Gestionare cereri',
  'registrations.manage': 'Gestionare înscrieri',
  // Financiar
  'payments.view': 'Vizualizare plăți',
  'payments.manage': 'Gestionare plăți',
  'shop.manage': 'Gestionare magazin',
  'fundraising.manage': 'Gestionare fundraising',
  // Setări
  'settings.manage': 'Gestionare setări',
  'users.manage': 'Gestionare utilizatori',
  'documents.manage': 'Gestionare documente',
  'notifications.manage': 'Gestionare notificări',
} as const

export type Permission = keyof typeof PERMISSIONS

export const PERMISSION_GROUPS: Record<string, { label: string; permissions: Permission[] }> = {
  continut: {
    label: 'Conținut',
    permissions: ['stories.view', 'stories.manage', 'gallery.view', 'gallery.manage'],
  },
  sport: {
    label: 'Sport',
    permissions: [
      'teams.view', 'teams.manage',
      'athletes.view', 'athletes.manage',
      'attendance.view', 'attendance.manage',
      'evaluations.view', 'evaluations.manage',
      'matches.view', 'matches.manage',
      'competitions.manage',
    ],
  },
  utilizatori: {
    label: 'Utilizatori',
    permissions: ['parents.view', 'parents.manage', 'requests.manage', 'registrations.manage'],
  },
  financiar: {
    label: 'Financiar',
    permissions: ['payments.view', 'payments.manage', 'shop.manage', 'fundraising.manage'],
  },
  setari: {
    label: 'Setări',
    permissions: ['settings.manage', 'users.manage', 'documents.manage', 'notifications.manage'],
  },
}

export const DEFAULT_ROLES: Record<string, { label: string; permissions: Permission[] }> = {
  admin: {
    label: 'Administrator',
    permissions: Object.keys(PERMISSIONS) as Permission[],
  },
  editor: {
    label: 'Editor',
    permissions: ['stories.view', 'stories.manage', 'gallery.view', 'gallery.manage'],
  },
  coach: {
    label: 'Antrenor',
    permissions: [
      'teams.view', 'athletes.view', 'athletes.manage',
      'attendance.view', 'attendance.manage',
      'evaluations.view', 'evaluations.manage',
      'matches.view',
    ],
  },
  manager: {
    label: 'Manager',
    permissions: [
      'teams.view', 'athletes.view',
      'payments.view', 'payments.manage',
      'shop.manage', 'fundraising.manage',
      'parents.view',
    ],
  },
  secretary: {
    label: 'Secretar',
    permissions: [
      'parents.view', 'parents.manage',
      'registrations.manage', 'requests.manage',
      'documents.manage', 'athletes.view',
    ],
  },
}

/**
 * Check if a user has a specific permission.
 * Backward compatible: legacy admin role always has full access.
 */
export async function hasPermission(userId: number, permission: Permission): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roleRef: true },
  })

  if (!user) return false

  // Backward compatibility: legacy 'admin' role has full access
  if (user.role === 'admin') return true

  // If user has a Role reference, use its permissions
  if (user.roleRef) {
    try {
      const perms: string[] = JSON.parse(user.roleRef.permissions)
      return Array.isArray(perms) && perms.includes(permission)
    } catch {
      return false
    }
  }

  // Fallback: use DEFAULT_ROLES based on legacy role string
  const defaultRole = DEFAULT_ROLES[user.role]
  if (defaultRole) {
    return defaultRole.permissions.includes(permission)
  }

  return false
}

/**
 * Get all permissions for a user.
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roleRef: true },
  })

  if (!user) return []

  // Backward compatibility: legacy 'admin' role has all permissions
  if (user.role === 'admin') {
    return Object.keys(PERMISSIONS)
  }

  // If user has a Role reference, use its permissions
  if (user.roleRef) {
    try {
      const perms: string[] = JSON.parse(user.roleRef.permissions)
      return Array.isArray(perms) ? perms : []
    } catch {
      return []
    }
  }

  // Fallback: use DEFAULT_ROLES based on legacy role string
  const defaultRole = DEFAULT_ROLES[user.role]
  if (defaultRole) {
    return [...defaultRole.permissions]
  }

  return []
}
