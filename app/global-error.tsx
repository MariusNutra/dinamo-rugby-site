'use client'

import { useEffect } from 'react'
import { reportClientError } from '@/lib/report-error'

/**
 * Prinde erorile care darama inclusiv layout-ul radacina — acolo unde
 * `app/error.tsx` nu mai apuca sa se afiseze. De aceea isi aduce propriul <html>
 * si stiluri inline: la momentul asta nu se mai poate baza pe nimic din layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportClientError(error)
  }, [error])

  return (
    <html lang="ro">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: '4rem 1rem',
          textAlign: 'center',
          color: '#111827',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Ceva nu a funcționat
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          A apărut o eroare neașteptată. Te rugăm să reîncerci.
        </p>
        <button
          onClick={reset}
          style={{
            background: '#D0021B',
            color: '#fff',
            border: 0,
            padding: '0.5rem 1.5rem',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Reîncearcă
        </button>
      </body>
    </html>
  )
}
