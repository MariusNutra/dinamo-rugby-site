'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

/**
 * Parent portal sign-in.
 *
 * Two ways in, deliberately kept side by side:
 *  - password (default) — the everyday route, once a parent has set one
 *  - email link — the passwordless route, and the only one that works for a
 *    parent who has never set a password (every account starts this way)
 *
 * "Forgot password" reuses /api/auth/forgot-password, which mails a reset link
 * to /reset-password?type=parent.
 */

type Mode = 'password' | 'link' | 'forgot'
type Status = 'idle' | 'sending' | 'sent' | 'error'

const INPUT_CLASS =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none text-base'

function LoginForm() {
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('error') === 'invalid_token') {
      setErrorMsg('Link-ul este invalid sau a expirat. Solicita un link nou.')
      setMode('link')
    }
    if (searchParams.get('parola') === 'setata') {
      setErrorMsg('')
    }
  }, [searchParams])

  const switchMode = (next: Mode) => {
    setMode(next)
    setStatus('idle')
    setErrorMsg('')
    setPassword('')
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/api/parinti/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Nu am putut face conectarea.')
        setStatus('error')
        return
      }

      router.push('/parinti/dashboard')
      router.refresh()
    } catch {
      setStatus('error')
      setErrorMsg('Eroare de conexiune. Incearca din nou.')
    }
  }

  // Both the magic link and the reset link post an email and answer neutrally,
  // so they share one submit handler.
  const handleEmailFlow = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    const endpoint = mode === 'forgot' ? '/api/auth/forgot-password' : '/api/parinti/auth'

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || data.message || 'Eroare la trimitere.')
        setStatus('error')
        return
      }

      setStatus('sent')
    } catch {
      setStatus('error')
      setErrorMsg('Eroare de conexiune. Incearca din nou.')
    }
  }

  if (status === 'sent') {
    const isForgot = mode === 'forgot'
    return (
      <Shell>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">&#9993;</div>
          <h2 className="font-heading text-xl font-bold text-green-800 mb-2">Verifica email-ul!</h2>
          <p className="text-green-700">
            Daca <strong>{email}</strong> este inregistrat, ti-am trimis{' '}
            {isForgot ? 'un link de resetare a parolei' : 'un link de acces'}. Verifica si folderul
            Spam daca nu gasesti email-ul.
          </p>
          <p className="text-green-600 text-sm mt-2">
            Linkul este valid {isForgot ? '1 ora' : '24 de ore'}.
          </p>
          <p className="text-gray-500 text-sm mt-3">
            Nu primesti nimic? Poate nu ai inca un cont.{' '}
            <Link href="/parinti/solicita-acces" className="text-dinamo-red hover:underline">
              Solicita acces
            </Link>
            .
          </p>
          <button
            onClick={() => switchMode('password')}
            className="mt-4 text-sm text-green-700 hover:underline"
          >
            Inapoi la conectare
          </button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={mode === 'password' ? handlePasswordLogin : handleEmailFlow}
        className="bg-white rounded-lg shadow-sm border p-6"
      >
        {mode === 'forgot' && (
          <p className="text-sm text-gray-600 mb-4">
            Scrie adresa ta de email si iti trimitem un link cu care iti setezi o parola noua.
          </p>
        )}
        {mode === 'link' && (
          <p className="text-sm text-gray-600 mb-4">
            Iti trimitem un link pe email cu care intri direct, fara parola.
          </p>
        )}

        <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
          Adresa de email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="parinte@exemplu.ro"
          required
          className={`${INPUT_CLASS} mb-4`}
        />

        {mode === 'password' && (
          <>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
              Parola
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className={`${INPUT_CLASS} mb-2`}
            />
            <div className="text-right mb-4">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-sm text-gray-500 hover:text-dinamo-red hover:underline"
              >
                Am uitat parola
              </button>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full bg-dinamo-red text-white py-3 px-6 rounded-lg font-heading font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {status === 'sending'
            ? 'Se trimite...'
            : mode === 'password'
              ? 'Intra in cont'
              : 'Trimite link pe email'}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center">
        {mode === 'password' ? (
          <p className="text-sm text-gray-600">
            Nu ti-ai setat inca o parola?{' '}
            <button
              type="button"
              onClick={() => switchMode('link')}
              className="text-dinamo-red font-medium hover:underline"
            >
              Intra cu link pe email
            </button>
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Ai deja parola?{' '}
            <button
              type="button"
              onClick={() => switchMode('password')}
              className="text-dinamo-red font-medium hover:underline"
            >
              Conecteaza-te cu parola
            </button>
          </p>
        )}

        <p className="text-sm text-gray-500">
          Accesul este gestionat de antrenorii echipei.{' '}
          <Link href="/parinti/solicita-acces" className="text-dinamo-red font-medium hover:underline">
            Nu ai cont? Solicita acces &rarr;
          </Link>
        </p>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/images/dinamo-rugby-bulldog.png"
            alt="Dinamo Rugby"
            width={80}
            height={80}
            className="w-20 h-20 mx-auto mb-4 object-contain"
          />
          <h1 className="font-heading text-3xl font-bold text-dinamo-blue mb-2">Portal Parinti</h1>
          <p className="text-gray-600">Acceseaza informatiile echipei copilului tau</p>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function ParintiLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
