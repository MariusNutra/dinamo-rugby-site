'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MIN_PASSWORD_LENGTH } from '@/lib/password-policy'

/**
 * Set or change the parent portal password, from inside an existing session.
 * Which of the two it is depends on `hasPassword` from /api/parinti/me — a
 * parent setting a first password has nothing to confirm against.
 */

const INPUT_CLASS =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dinamo-red focus:border-transparent outline-none text-base'

export default function ParolaPage() {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [okMsg, setOkMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/parinti/me')
      .then(r => (r.ok ? r.json() : null))
      .then(d => setHasPassword(d ? Boolean(d.hasPassword) : false))
      .catch(() => setHasPassword(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setOkMsg('')

    if (password !== confirm) {
      setErrorMsg('Cele doua parole nu sunt la fel.')
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(`Parola trebuie sa aiba minim ${MIN_PASSWORD_LENGTH} caractere.`)
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/parinti/parola', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          hasPassword ? { password, currentPassword } : { password }
        ),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Nu am putut salva parola.')
        setSaving(false)
        return
      }

      setOkMsg(data.message || 'Parola a fost salvata.')
      setHasPassword(true)
      setCurrentPassword('')
      setPassword('')
      setConfirm('')
      setSaving(false)
      setTimeout(() => router.push('/parinti/dashboard'), 1500)
    } catch {
      setErrorMsg('Eroare de conexiune. Incearca din nou.')
      setSaving(false)
    }
  }

  if (hasPassword === null) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-heading text-2xl font-bold text-dinamo-blue mb-2">
        {hasPassword ? 'Schimba parola' : 'Seteaza-ti o parola'}
      </h1>
      <p className="text-gray-600 text-sm mb-6">
        {hasPassword
          ? 'Dupa schimbare vei ramane conectat aici, dar va trebui sa te reconectezi pe telefon.'
          : 'Cu o parola intri direct in portal, fara sa mai astepti link pe email de fiecare data.'}
      </p>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {errorMsg}
        </div>
      )}
      {okMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
          {okMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
        {hasPassword && (
          <>
            <label htmlFor="current" className="block mb-2 text-sm font-medium text-gray-700">
              Parola actuala
            </label>
            <input
              id="current"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              className={`${INPUT_CLASS} mb-4`}
            />
          </>
        )}

        <label htmlFor="new" className="block mb-2 text-sm font-medium text-gray-700">
          Parola noua
        </label>
        <input
          id="new"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={MIN_PASSWORD_LENGTH}
          className={INPUT_CLASS}
        />
        <p className="text-xs text-gray-500 mt-1 mb-4">Minim {MIN_PASSWORD_LENGTH} caractere.</p>

        <label htmlFor="confirm" className="block mb-2 text-sm font-medium text-gray-700">
          Scrie parola inca o data
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          className={`${INPUT_CLASS} mb-6`}
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-dinamo-red text-white py-3 px-6 rounded-lg font-heading font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Se salveaza...' : hasPassword ? 'Schimba parola' : 'Seteaza parola'}
        </button>
      </form>

      <div className="text-center mt-6">
        <Link href="/parinti/dashboard" className="text-sm text-gray-500 hover:text-dinamo-red">
          &larr; Inapoi la portal
        </Link>
      </div>
    </div>
  )
}
