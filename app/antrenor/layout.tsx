'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const PUBLIC_PATHS = ['/antrenor', '/antrenor/login', '/antrenor/inregistrare']

export default function AntrenorLayout({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<boolean | null>(null)
  const [coachName, setCoachName] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  const isPublic = PUBLIC_PATHS.includes(pathname)

  useEffect(() => {
    if (isPublic) {
      setAuth(false)
      return
    }

    fetch('/api/antrenor/auth/check')
      .then(r => r.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/antrenor/login')
        } else {
          setAuth(true)
          fetch('/api/antrenor/me').then(r => r.json()).then(d => {
            if (d.name) setCoachName(d.name)
          }).catch(() => {})
        }
      })
  }, [pathname, router, isPublic])

  const handleLogout = async () => {
    await fetch('/api/antrenor/auth/logout', { method: 'POST' })
    router.push('/antrenor/login')
  }

  if (!isPublic && auth === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {auth && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <Link href="/antrenor/dashboard" className="font-heading font-bold text-dinamo-blue text-lg">
            Portal Antrenori
          </Link>
          <div className="flex items-center gap-4">
            {coachName && <span className="text-sm text-gray-600 hidden sm:block">{coachName}</span>}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-dinamo-red transition-colors"
            >
              Deconectare
            </button>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
