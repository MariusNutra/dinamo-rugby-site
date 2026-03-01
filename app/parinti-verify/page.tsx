'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Link invalid. Solicita un link nou din pagina de login.')
      return
    }

    // POST the token to the API (prevents token leaking in referrer/history)
    fetch('/api/parinti-secure/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.redirect) {
          // Clear token from URL
          window.history.replaceState({}, '', '/parinti/verify')
          router.push(data.redirect)
        } else {
          setError(data.error || 'Link-ul este invalid sau a expirat.')
        }
      })
      .catch(() => {
        setError('Eroare de conexiune. Incearca din nou.')
      })
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">&#9888;</div>
          <h2 className="font-heading text-xl font-bold text-red-700 mb-2">Link invalid</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <a href="/parinti" className="text-dinamo-red font-medium hover:underline">
            &larr; Inapoi la login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Se verifica linkul...</p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
