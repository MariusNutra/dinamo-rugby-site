'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MIN_PASSWORD_LENGTH } from '@/lib/password-policy'

/**
 * Parintele deschide (sau inchide) accesul propriu al unui copil.
 *
 * Copilul nu-si poate crea singur cont: sub 16 ani nu poate consimti la
 * prelucrarea datelor sale. Aici nu se cere nimic nou despre el — numele de
 * utilizator vine din numele lui, iar parola o alege parintele si i-o spune.
 */
export default function AccesSportiv() {
  const { childId } = useParams<{ childId: string }>()
  const [stare, setStare] = useState<{ accessEnabled: boolean; username: string; areParola: boolean } | null>(null)
  const [numeCopil, setNumeCopil] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [seSalveaza, setSeSalveaza] = useState(false)
  const [eroare, setEroare] = useState('')
  const [reusit, setReusit] = useState('')

  const incarca = () => {
    fetch(`/api/parinti/acces-sportiv/${childId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setStare)
      .catch(() => setStare(null))
  }

  useEffect(() => {
    incarca()
    fetch('/api/parinti/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const copil = d?.children?.find((c: { id: string }) => c.id === childId)
        if (copil) setNumeCopil(copil.name)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId])

  const salveaza = async (e: React.FormEvent) => {
    e.preventDefault()
    setEroare('')
    setReusit('')

    if (password !== confirm) {
      setEroare('Cele doua parole nu sunt la fel.')
      return
    }

    setSeSalveaza(true)
    try {
      const r = await fetch(`/api/parinti/acces-sportiv/${childId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const d = await r.json()
      if (!r.ok) {
        setEroare(d.error || 'Nu am putut salva.')
        setSeSalveaza(false)
        return
      }
      setReusit(d.message)
      setPassword('')
      setConfirm('')
      incarca()
    } catch {
      setEroare('Eroare de conexiune.')
    }
    setSeSalveaza(false)
  }

  const inchide = async () => {
    if (!confirm_(`Inchizi accesul lui ${numeCopil || 'copilul tau'}? Nu va mai putea intra in portalul sportivilor.`)) return
    setSeSalveaza(true)
    await fetch(`/api/parinti/acces-sportiv/${childId}`, { method: 'DELETE' })
    setReusit('Accesul a fost inchis.')
    incarca()
    setSeSalveaza(false)
  }

  if (!stare) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-dinamo-red border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-heading text-2xl font-bold text-dinamo-blue">
        Acces pentru {numeCopil || 'copilul tau'}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Cu utilizatorul si parola de mai jos, copilul isi vede clasamentul si progresul, isi da singur
        prezenta la antrenament si primeste notificari pe telefonul lui.
      </p>

      <div className="mt-4 rounded-lg border bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-500">Utilizator</p>
        <p className="font-mono text-lg font-medium text-gray-900">{stare.username}</p>
        <p className="mt-1 text-xs text-gray-500">
          {stare.accessEnabled ? 'Accesul este deschis.' : 'Accesul nu este deschis inca.'}
        </p>
      </div>

      {eroare && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{eroare}</div>}
      {reusit && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">{reusit}</div>}

      <form onSubmit={salveaza} className="mt-4 rounded-lg border bg-white p-6 shadow-sm">
        <label htmlFor="p1" className="mb-2 block text-sm font-medium text-gray-700">
          {stare.accessEnabled ? 'Parola noua' : 'Alege o parola'}
        </label>
        <input
          id="p1"
          type="text"
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={MIN_PASSWORD_LENGTH}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-transparent focus:ring-2 focus:ring-dinamo-red"
        />
        <p className="mb-4 mt-1 text-xs text-gray-500">
          Minim {MIN_PASSWORD_LENGTH} caractere. O vezi scrisa, ca sa i-o poti spune copilului.
        </p>

        <label htmlFor="p2" className="mb-2 block text-sm font-medium text-gray-700">
          Scrie parola inca o data
        </label>
        <input
          id="p2"
          type="text"
          autoComplete="off"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-transparent focus:ring-2 focus:ring-dinamo-red"
        />

        <button
          type="submit"
          disabled={seSalveaza}
          className="w-full rounded-lg bg-dinamo-red px-6 py-3 font-heading text-lg font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {seSalveaza ? 'Se salveaza...' : stare.accessEnabled ? 'Schimba parola' : 'Deschide accesul'}
        </button>
      </form>

      {stare.accessEnabled && (
        <button
          onClick={inchide}
          disabled={seSalveaza}
          className="mt-3 w-full rounded-lg border border-red-200 px-6 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          Inchide accesul
        </button>
      )}

      <div className="mt-6 text-center">
        <Link href="/parinti/dashboard" className="text-sm text-gray-500 hover:text-dinamo-red">
          &larr; Inapoi la portal
        </Link>
      </div>
    </div>
  )
}

/** `confirm` global, izolat ca sa nu se confunde cu starea `confirm` de mai sus. */
function confirm_(mesaj: string): boolean {
  return window.confirm(mesaj)
}
