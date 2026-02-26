import Link from 'next/link'

export default function StatisticiPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="text-5xl mb-4">📊</div>
        <h1 className="font-heading text-2xl font-bold text-dinamo-blue mb-3">Statistici</h1>
        <p className="text-gray-500 mb-6">Aceasta sectiune va fi disponibila in curand.</p>
        <Link href="/"
          className="inline-block px-6 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
          Inapoi la pagina principala
        </Link>
      </div>
    </div>
  )
}
