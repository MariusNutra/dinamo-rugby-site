'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import PasswordInput from '@/components/PasswordInput'

export default function LoginFotoPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/api/foto/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Eroare la conectare.')
        setStatus('error')
        return
      }

      router.push(data.redirect || '/foto/media')
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
          <h1 className="font-heading text-3xl font-bold text-dinamo-blue mb-2">Portal Foto</h1>
          <p className="text-gray-600">Conecteaza-te ca sa incarci poze si filmulete</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Utilizator
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Parola
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full bg-dinamo-red text-white font-bold py-2.5 rounded-lg hover:bg-dinamo-dark transition-colors disabled:opacity-60"
          >
            {status === 'sending' ? 'Se conecteaza...' : 'Intra in cont'}
          </button>

          <p className="text-xs text-gray-500 text-center pt-2">
            Contul se creeaza de catre administratorul clubului.
          </p>
        </form>
      </div>
    </div>
  )
}
