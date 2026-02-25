'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [notRegistered, setNotRegistered] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('error') === 'invalid_token') {
      setErrorMsg('Link-ul este invalid sau a expirat. Solicita un link nou.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')
    setNotRegistered(false)

    try {
      const res = await fetch('/api/parinti/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'not_registered') {
          setNotRegistered(true)
          setStatus('error')
        } else {
          setErrorMsg(data.error || data.message || 'Eroare la trimitere.')
          setStatus('error')
        }
        return
      }

      setStatus('sent')
    } catch {
      setStatus('error')
      setErrorMsg('Eroare de conexiune. Incearca din nou.')
    }
  }

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

        {errorMsg && !notRegistered && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {errorMsg}
          </div>
        )}

        {notRegistered && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4">
            <p className="font-medium mb-1">Acest email nu este inregistrat.</p>
            <p className="text-sm">
              Solicita acces mai jos sau contacteaza antrenorul echipei.
            </p>
          </div>
        )}

        {status === 'sent' ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">&#9993;</div>
            <h2 className="font-heading text-xl font-bold text-green-800 mb-2">
              Verifica email-ul!
            </h2>
            <p className="text-green-700">
              Am trimis un link de acces la <strong>{email}</strong>.
              Verifica si folderul Spam daca nu gasesti email-ul.
            </p>
            <p className="text-green-600 text-sm mt-2">Linkul este valid 24 de ore.</p>
            <button
              onClick={() => { setStatus('idle'); setEmail('') }}
              className="mt-4 text-sm text-green-600 hover:underline"
            >
              Trimite din nou
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Adresa de email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="parinte@exemplu.ro"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none mb-4 text-base"
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full bg-dinamo-red text-white py-3 px-6 rounded-lg font-heading font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {status === 'sending' ? 'Se trimite...' : 'Conecteaza-te'}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-500 mb-2">Accesul este gestionat de antrenorii echipei</p>
              <Link
                href="/parinti/solicita-acces"
                className="text-dinamo-red font-medium text-sm hover:underline"
              >
                Nu ai cont? Solicita acces &rarr;
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ParintiLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
