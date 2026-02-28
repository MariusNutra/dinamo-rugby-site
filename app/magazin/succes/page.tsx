'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccesContent() {
  const params = useSearchParams()
  const status = params.get('status')
  const isSuccess = status === 'success'

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-bold text-gray-900 mb-3">Comanda plasata cu succes!</h1>
            <p className="text-gray-600 mb-6">Multumim pentru comanda! Vei primi un email de confirmare in curand.</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-bold text-gray-900 mb-3">Comanda anulata</h1>
            <p className="text-gray-600 mb-6">Comanda nu a fost finalizata. Poti reveni oricand la magazin.</p>
          </>
        )}
        <Link href="/magazin" className="inline-block px-6 py-3 bg-dinamo-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
          Inapoi la magazin
        </Link>
      </div>
    </div>
  )
}

export default function MagazinSuccesPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full" /></div>}>
      <SuccesContent />
    </Suspense>
  )
}
