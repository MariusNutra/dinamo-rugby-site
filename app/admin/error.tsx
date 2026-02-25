'use client'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="font-heading font-bold text-2xl text-gray-900 mb-2">Eroare</h2>
        <p className="text-gray-500 mb-4">A apărut o eroare neașteptată.</p>
        <p className="text-sm text-gray-400 mb-6 font-mono">{error.message}</p>
        <button onClick={reset}
          className="bg-dinamo-blue text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors">
          Reîncearcă
        </button>
      </div>
    </div>
  )
}
