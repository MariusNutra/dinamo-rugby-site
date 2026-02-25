'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const PUBLIC_PATHS = ['/parinti', '/parinti/verify']

export default function ParintiLayout({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<boolean | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const isPublic = PUBLIC_PATHS.includes(pathname)

  useEffect(() => {
    if (isPublic) {
      setAuth(false)
      return
    }

    fetch('/api/parinti/auth/check')
      .then(r => r.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/parinti')
        } else {
          setAuth(true)
        }
      })
  }, [pathname, router, isPublic])

  const handleLogout = async () => {
    await fetch('/api/parinti/auth/logout', { method: 'POST' })
    router.push('/parinti')
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
          <Link href="/parinti/dashboard" className="font-heading font-bold text-dinamo-blue text-lg">
            Portal Parinti
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-dinamo-red transition-colors"
          >
            Deconectare
          </button>
        </div>
      )}
      {children}
    </div>
  )
}
