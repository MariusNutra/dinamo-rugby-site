'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginAntrenorPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/api/antrenor/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Eroare la conectare.')
        setStatus('error')
        return
      }

      router.push(data.redirect || '/antrenor/dashboard')
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
          <h1 className="font-heading text-3xl font-bold text-dinamo-blue mb-2">Portal Antrenori</h1>
          <p className="text-gray-600">Conecteaza-te pentru a accesa portalul</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parola</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none text-base"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full bg-dinamo-red text-white py-3 px-6 rounded-lg font-heading font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {status === 'sending' ? 'Se conecteaza...' : 'Conecteaza-te'}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/antrenor/inregistrare"
            className="text-dinamo-red font-medium text-sm hover:underline"
          >
            Nu ai cont? Inregistreaza-te &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
