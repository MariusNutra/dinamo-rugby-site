'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

/** Paginile pe care le poate vedea si cineva nelogat. */
const PUBLICE = ['/sportiv']

export default function LayoutSportiv({ children }: { children: React.ReactNode }) {
  const [logat, setLogat] = useState<boolean | null>(null)
  const [nume, setNume] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const ePublica = PUBLICE.includes(pathname)

  useEffect(() => {
    if (ePublica) {
      setLogat(false)
      return
    }
    fetch('/api/sportiv/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) {
          router.push('/sportiv')
          return
        }
        setNume(d.name)
        setLogat(true)
      })
      .catch(() => router.push('/sportiv'))
  }, [pathname, router, ePublica])

  const iesire = async () => {
    await fetch('/api/sportiv/logout', { method: 'POST' })
    router.push('/sportiv')
    router.refresh()
  }

  if (!ePublica && logat === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-dinamo-red border-t-transparent"></div>
      </div>
    )
  }

  const legatura = (href: string, eticheta: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        pathname === href ? 'bg-dinamo-red text-white' : 'text-gray-600 hover:text-dinamo-red'
      }`}
    >
      {eticheta}
    </Link>
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {logat && (
        <div className="mb-6 border-b pb-4">
          <div className="flex items-center justify-between">
            <Link href="/sportiv/acasa" className="font-heading text-lg font-bold text-dinamo-blue">
              {nume || 'Portal Sportivi'}
            </Link>
            <button onClick={iesire} className="text-sm text-gray-500 transition-colors hover:text-dinamo-red">
              Iesire
            </button>
          </div>
          <nav className="mt-3 flex gap-1 overflow-x-auto">
            {legatura('/sportiv/acasa', 'Acasa')}
            {legatura('/sportiv/prezenta', 'Prezenta')}
            {legatura('/sportiv/clasament', 'Clasament')}
          </nav>
        </div>
      )}
      {children}
    </div>
  )
}
