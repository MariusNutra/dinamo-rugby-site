import Link from 'next/link'

interface TeamCardProps {
  grupa: string
  description?: string
}

const grupaColors: Record<string, string> = {
  U10: 'from-green-500 to-green-700',
  U12: 'from-blue-500 to-blue-700',
  U14: 'from-dinamo-red to-dinamo-dark',
  U16: 'from-purple-500 to-purple-700',
  U18: 'from-dinamo-blue to-gray-900',
}

const grupaAges: Record<string, string> = {
  U10: '8-10 ani',
  U12: '10-12 ani',
  U14: '12-14 ani',
  U16: '14-16 ani',
  U18: '16-18 ani',
}

export default function TeamCard({ grupa, description }: TeamCardProps) {
  return (
    <Link href={`/echipe/${grupa}`}
      className="group block rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
      <div className={`bg-gradient-to-br ${grupaColors[grupa] || 'from-gray-500 to-gray-700'} p-8 text-white text-center`}>
        <div className="text-5xl font-heading font-extrabold mb-2 group-hover:scale-110 transition-transform">
          {grupa}
        </div>
        <div className="text-white/80 text-sm font-medium">{grupaAges[grupa]}</div>
      </div>
      <div className="bg-white p-4 text-center">
        <p className="text-sm text-gray-600">{description || 'Descoperă echipa'}</p>
        <span className="inline-block mt-2 text-dinamo-red text-sm font-bold group-hover:underline">
          Vezi detalii →
        </span>
      </div>
    </Link>
  )
}
