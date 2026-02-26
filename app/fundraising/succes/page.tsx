'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')

  if (status === 'cancel') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="text-5xl mb-4">😔</div>
          <h1 className="font-heading text-2xl font-bold text-gray-700 mb-3">Plata anulata</h1>
          <p className="text-gray-500 mb-6">Donatia nu a fost procesata. Poti incerca din nou oricand.</p>
          <Link href="/fundraising"
            className="inline-block px-6 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
            Inapoi la campanii
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="font-heading text-2xl font-bold text-green-600 mb-3">Multumim pentru donatie!</h1>
        <p className="text-gray-600 mb-6">
          Donatia ta a fost inregistrata cu succes. Vei primi un email de confirmare in curand.
        </p>
        <Link href="/fundraising"
          className="inline-block px-6 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
          Inapoi la campanii
        </Link>
      </div>
    </div>
  )
}

export default function FundraisingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
