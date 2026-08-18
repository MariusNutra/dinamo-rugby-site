'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

/**
 * Pagina pe care o deschide codul QR de la antrenament.
 *
 * Acelasi cod e scanat si de parinti, si de sportivi. Inainte ducea direct in
 * portalul parintilor, ceea ce pentru un copil logat ca sportiv insemna un
 * ecran care nu era al lui. Aici doar aflam cine e si il trimitem mai departe,
 * pastrand codul.
 */
function Dispecer() {
  const token = useSearchParams().get('token')
  const router = useRouter()
  const [nelogat, setNelogat] = useState(false)

  useEffect(() => {
    const coada = token ? `?token=${encodeURIComponent(token)}` : ''

    fetch('/api/sportiv/me')
      .then((r) => {
        if (r.ok) {
          router.replace(`/sportiv/prezenta${coada}`)
          return null
        }
        return fetch('/api/parinti/auth/check').then((r2) => (r2.ok ? r2.json() : null))
      })
      .then((d) => {
        if (d === null) return
        if (d?.authenticated) {
          router.replace(`/parinti/checkin${coada}`)
          return
        }
        setNelogat(true)
      })
      .catch(() => setNelogat(true))
  }, [token, router])

  if (!nelogat) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-dinamo-red border-t-transparent"></div>
      </div>
    )
  }

  const coada = token ? `?token=${encodeURIComponent(token)}` : ''

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <Image
          src="/images/dinamo-rugby-bulldog.png"
          alt="Dinamo Rugby"
          width={72}
          height={72}
          className="mx-auto mb-4 h-18 w-18 object-contain"
        />
        <h1 className="font-heading text-2xl font-bold text-dinamo-blue">Prezenta la antrenament</h1>
        <p className="mt-2 text-gray-600">Conecteaza-te ca sa se inregistreze prezenta.</p>
        <div className="mt-6 space-y-3">
          <Link
            href={`/sportiv${coada}`}
            className="block rounded-lg bg-dinamo-red px-6 py-3 font-heading font-bold text-white transition-colors hover:bg-red-700"
          >
            Sunt sportiv
          </Link>
          <Link
            href="/parinti"
            className="block rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:border-dinamo-red hover:text-dinamo-red"
          >
            Sunt parinte
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaginaPrezentaQR() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-dinamo-red border-t-transparent"></div>
        </div>
      }
    >
      <Dispecer />
    </Suspense>
  )
}
