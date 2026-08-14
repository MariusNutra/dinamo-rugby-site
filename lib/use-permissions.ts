'use client'

import { useEffect, useState } from 'react'

/**
 * Permisiunile utilizatorului logat in panou, pentru ecranele care trebuie sa
 * ascunda butoane. Serverul ramane cel care decide — asta doar evita sa
 * oferim actiuni care se termina in 403.
 *
 * `null` cat timp nu stim inca; ecranele trateaza asta ca „nu arata nimic".
 */
export function usePermissions(): string[] | null {
  const [permissions, setPermissions] = useState<string[] | null>(null)

  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => (r.ok ? r.json() : null))
      .then(d => setPermissions(Array.isArray(d?.permissions) ? d.permissions : []))
      .catch(() => setPermissions([]))
  }, [])

  return permissions
}
