'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Stare = 'astept' | 'trimit' | 'gata' | 'deja' | 'eroare'

/**
 * Sportivul isi da singur prezenta scanand codul QR al antrenorului.
 * Copilul nu se trimite in cerere — serverul il ia din sesiune, altfel un
 * sportiv ar putea inregistra prezenta altuia.
 */
function Prezenta() {
  const token = useSearchParams().get('token')
  const [stare, setStare] = useState<Stare>('astept')
  const [mesaj, setMesaj] = useState('')

  useEffect(() => {
    if (!token) return
    setStare('trimit')
    fetch('/api/attendance/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrToken: token }),
    })
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) {
          setMesaj(d.error || 'Nu am putut inregistra prezenta.')
          setStare('eroare')
          return
        }
        if (d.alreadyCheckedIn) {
          setMesaj('Prezenta era deja inregistrata.')
          setStare('deja')
          return
        }
        setMesaj(d.message || 'Prezenta inregistrata!')
        setStare('gata')
      })
      .catch(() => {
        setMesaj('Eroare de conexiune.')
        setStare('eroare')
      })
  }, [token])

  if (!token) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center">
        <div className="mb-3 text-4xl" aria-hidden>📷</div>
        <h1 className="font-heading text-xl font-bold text-dinamo-blue">Da prezenta</h1>
        <p className="mt-2 text-gray-600">
          Scaneaza cu telefonul codul QR pe care ti-l arata antrenorul la antrenament.
        </p>
        <p className="mt-3 text-sm text-gray-500">
          Se deschide singura pagina asta si prezenta se inregistreaza automat.
        </p>
      </div>
    )
  }

  const culori: Record<Stare, string> = {
    astept: 'border-gray-200 bg-white',
    trimit: 'border-gray-200 bg-white',
    gata: 'border-green-200 bg-green-50',
    deja: 'border-blue-200 bg-blue-50',
    eroare: 'border-red-200 bg-red-50',
  }

  return (
    <div className={`rounded-lg border p-6 text-center ${culori[stare]}`}>
      {stare === 'trimit' ? (
        <>
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-dinamo-red border-t-transparent"></div>
          <p className="text-gray-600">Se inregistreaza...</p>
        </>
      ) : (
        <>
          <div className="mb-3 text-4xl" aria-hidden>
            {stare === 'gata' ? '✅' : stare === 'deja' ? 'ℹ️' : '⚠️'}
          </div>
          <h1
            className={`font-heading text-xl font-bold ${
              stare === 'gata' ? 'text-green-800' : stare === 'deja' ? 'text-blue-800' : 'text-red-700'
            }`}
          >
            {stare === 'gata' ? 'Gata!' : stare === 'deja' ? 'Deja bifat' : 'Nu a mers'}
          </h1>
          <p className="mt-2 text-gray-700">{mesaj}</p>
        </>
      )}
    </div>
  )
}

export default function PaginaPrezenta() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-dinamo-red border-t-transparent"></div>
        </div>
      }
    >
      <Prezenta />
    </Suspense>
  )
}
