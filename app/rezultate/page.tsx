import { getResultsData, isDataStale } from '@/lib/results'
import ResultsClient from './ResultsClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Rezultate și Clasamente | Dinamo Rugby Juniori',
  description: 'Program, rezultate și clasamente din campionatele naționale de rugby juniori U16, U18 și U20.',
}

export default function RezultatePage() {
  const data = getResultsData()
  const stale = isDataStale()

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="font-heading font-bold text-3xl text-gray-900 mb-4">
          Rezultate și Clasamente
        </h1>
        <p className="text-gray-500 text-lg mb-6">
          Rezultatele vor fi disponibile în curând.
        </p>
        <Link
          href="https://rugbyromania.ro"
          target="_blank"
          rel="noopener noreferrer"
          className="text-dinamo-red font-bold hover:underline"
        >
          Vezi rezultatele pe rugbyromania.ro →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-gray-900 mb-2">
          Rezultate și Clasamente
        </h1>
        <p className="text-gray-500">
          Program, rezultate și clasamente din campionatele naționale de juniori
        </p>
      </div>

      {stale && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-6 text-sm text-yellow-800">
          Datele pot să nu fie actualizate. Ultima actualizare:{' '}
          {new Date(data.lastUpdated).toLocaleDateString('ro-RO', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}

      <ResultsClient data={data} />
    </div>
  )
}
