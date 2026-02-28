'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Child {
  id: string
  name: string
  teamId: number | null
}

function CheckinContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({})

  useEffect(() => {
    fetch('/api/parinti/profile')
      .then(r => {
        if (!r.ok) throw new Error('Not authenticated')
        return r.json()
      })
      .then(data => {
        if (data.children) setChildren(data.children)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const handleCheckin = async (childId: string) => {
    if (!token) return
    setChecking(childId)
    try {
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: token, childId }),
      })
      const data = await res.json()
      if (res.ok) {
        setResults(prev => ({
          ...prev,
          [childId]: { success: true, message: data.message || 'Prezență înregistrată!' },
        }))
      } else {
        setResults(prev => ({
          ...prev,
          [childId]: { success: false, message: data.error || 'Eroare la check-in' },
        }))
      }
    } catch {
      setResults(prev => ({
        ...prev,
        [childId]: { success: false, message: 'Eroare de conexiune' },
      }))
    }
    setChecking(null)
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="font-heading font-bold text-xl mb-2">Link invalid</h1>
          <p className="text-gray-500 text-sm mb-4">Acest link de check-in nu este valid. Scanează din nou codul QR.</p>
          <Link href="/parinti/dashboard" className="text-dinamo-red hover:underline text-sm font-medium">
            Înapoi la dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full" />
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="font-heading font-bold text-xl mb-2">Autentificare necesară</h1>
          <p className="text-gray-500 text-sm mb-4">
            Trebuie să fii autentificat pentru a înregistra prezența.
          </p>
          <Link href="/parinti" className="inline-block px-6 py-2 bg-dinamo-red text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors">
            Autentifică-te
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="font-heading font-bold text-xl">Check-in Prezență</h1>
          <p className="text-gray-500 text-sm mt-1">Selectează copilul pentru înregistrarea prezenței</p>
        </div>

        <div className="space-y-3">
          {children.map(child => {
            const result = results[child.id]
            return (
              <div key={child.id} className="border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{child.name}</p>
                  </div>
                  {result ? (
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {result.success ? 'Prezent!' : result.message}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCheckin(child.id)}
                      disabled={checking === child.id}
                      className="px-4 py-2 bg-dinamo-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {checking === child.id ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          Se verifică...
                        </span>
                      ) : (
                        'Check-in'
                      )}
                    </button>
                  )}
                </div>
                {result && (
                  <p className={`text-xs mt-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.message}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 text-center">
          <Link href="/parinti/dashboard" className="text-sm text-gray-500 hover:text-dinamo-red">
            Înapoi la dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full" />
      </div>
    }>
      <CheckinContent />
    </Suspense>
  )
}
