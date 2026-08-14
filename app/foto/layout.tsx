'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const PUBLIC_PATHS = ['/foto', '/foto/login']

export default function FotoLayout({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<boolean | null>(null)
  const [name, setName] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  const isPublic = PUBLIC_PATHS.includes(pathname)

  useEffect(() => {
    if (isPublic) {
      setAuth(false)
      return
    }

    fetch('/api/foto/auth/check')
      .then(r => r.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/foto/login')
          return
        }
        setAuth(true)
        fetch('/api/foto/me')
          .then(r => r.json())
          .then(d => {
            if (d?.name) setName(d.name)
          })
          .catch(() => {})
      })
      .catch(() => router.push('/foto/login'))
  }, [pathname, router, isPublic])

  const handleLogout = async () => {
    await fetch('/api/foto/auth', { method: 'DELETE' })
    router.push('/foto/login')
  }

  if (!isPublic && auth === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {auth && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <Link href="/foto/media" className="font-heading font-bold text-dinamo-blue text-lg">
            Portal Foto
          </Link>
          <div className="flex items-center gap-4">
            {name && <span className="text-sm text-gray-600 hidden sm:block">{name}</span>}
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
