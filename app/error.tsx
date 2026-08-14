'use client'

import { useEffect } from 'react'
import { reportClientError } from '@/lib/report-error'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="font-heading font-bold text-2xl text-gray-900 mb-2">Ceva nu a funcționat</h2>
        <p className="text-gray-500 mb-6">A apărut o eroare neașteptată. Te rugăm să reîncerci.</p>
        <button onClick={reset}
          className="bg-dinamo-red text-white px-6 py-2 rounded-lg hover:bg-dinamo-dark transition-colors">
          Reîncearcă
        </button>
      </div>
    </div>
  )
}
