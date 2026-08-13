'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import PasswordInput from '@/components/PasswordInput'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const type = searchParams.get('type')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const [valid, setValid] = useState(true)

  useEffect(() => {
    if (!token || !type) {
      setValid(false)
    }
  }, [token, type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.')
      return
    }

    if (password !== confirmPassword) {
      setError('Parolele nu se potrivesc.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type, newPassword: password }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Eroare la resetarea parolei.')
      }
    } catch {
      setError('Eroare de conexiune. Încearcă din nou.')
    } finally {
      setLoading(false)
    }
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <Image src="/images/dinamo-rugby-bulldog.png" alt="Dinamo Rugby" width={80} height={80} className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-4">Link invalid</h1>
          <p className="text-gray-600 mb-6">Link-ul de resetare a parolei este invalid sau a expirat.</p>
          <Link href="/" className="text-dinamo-red hover:underline">← Înapoi la site</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <Image src="/images/dinamo-rugby-bulldog.png" alt="Dinamo Rugby" width={80} height={80} className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-4">Parolă resetată!</h1>
          <p className="text-gray-600 mb-6">Parola ta a fost schimbată cu succes. Te poți conecta acum cu noua parolă.</p>
          {type === 'admin' ? (
            <Link href="/admin/login" className="inline-block bg-dinamo-red text-white px-6 py-3 rounded-lg font-heading font-bold hover:bg-dinamo-dark transition-colors">
              Mergi la login
            </Link>
          ) : (
            <p className="text-gray-500 text-sm">Deschide aplicația Dinamo Rugby pentru a te conecta.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/images/dinamo-rugby-bulldog.png" alt="Dinamo Rugby" width={80} height={80} className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="font-heading font-bold text-2xl text-gray-900">Resetare parolă</h1>
          <p className="text-gray-500 text-sm mt-1">Introdu noua ta parolă</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parolă nouă</label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmă parola</label>
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-dinamo-red text-white py-3 rounded-lg font-heading font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Se procesează...' : 'Resetează parola'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Se încarcă...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
