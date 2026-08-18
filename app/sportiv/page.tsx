'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

/**
 * Logarea sportivului: nume de utilizator si parola, primite de la parinte.
 * Fara email si fara „am uitat parola" — copilul nu are adresa proprie, deci
 * recuperarea trece tot prin parinte, din portalul lui.
 */
function FormularSportiv() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [seTrimite, setSeTrimite] = useState(false)
  const [eroare, setEroare] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const trimite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSeTrimite(true)
    setEroare('')
    try {
      const r = await fetch('/api/sportiv/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const d = await r.json()
      if (!r.ok) {
        setEroare(d.error || 'Nu am putut face conectarea.')
        setSeTrimite(false)
        return
      }
      // Daca a ajuns aici scanand un cod QR, il ducem direct la prezenta.
      router.push(token ? `/sportiv/prezenta?token=${encodeURIComponent(token)}` : '/sportiv/acasa')
      router.refresh()
    } catch {
      setEroare('Eroare de conexiune. Incearca din nou.')
      setSeTrimite(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image
            src="/images/dinamo-rugby-bulldog.png"
            alt="Dinamo Rugby"
            width={80}
            height={80}
            className="mx-auto mb-4 h-20 w-20 object-contain"
          />
          <h1 className="font-heading text-3xl font-bold text-dinamo-blue">Portal Sportivi</h1>
          <p className="mt-1 text-gray-600">Prezenta, clasament si progresul tau</p>
        </div>

        {eroare && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{eroare}</div>
        )}

        <form onSubmit={trimite} className="rounded-lg border bg-white p-6 shadow-sm">
          <label htmlFor="username" className="mb-2 block text-sm font-medium text-gray-700">
            Utilizator
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="prenume.nume"
            required
            className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-transparent focus:ring-2 focus:ring-dinamo-red"
          />

          <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
            Parola
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-transparent focus:ring-2 focus:ring-dinamo-red"
          />

          <button
            type="submit"
            disabled={seTrimite}
            className="w-full rounded-lg bg-dinamo-red px-6 py-3 font-heading text-lg font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {seTrimite ? 'Se conecteaza...' : 'Intra in cont'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Nu ai utilizator si parola? Ti le da parintele tau, din{' '}
          <Link href="/parinti" className="font-medium text-dinamo-red hover:underline">
            portalul parintilor
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export default function PaginaSportiv() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-dinamo-red border-t-transparent"></div>
        </div>
      }
    >
      <FormularSportiv />
    </Suspense>
  )
}
