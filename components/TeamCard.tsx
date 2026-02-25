import Link from 'next/link'
import { getColorConfig } from '@/lib/team-colors'

interface TeamCardProps {
  grupa: string
  color?: string
  ageRange?: string | null
  description?: string
}

export default function TeamCard({ grupa, color, ageRange, description }: TeamCardProps) {
  const colorConfig = getColorConfig(color || 'green')

  return (
    <Link href={`/echipe/${grupa}`}
      className="group block w-40 sm:w-44 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
      <div className={`bg-gradient-to-br ${colorConfig.gradient} p-8 text-white text-center`}>
        <div className="text-5xl font-heading font-extrabold mb-2 group-hover:scale-110 transition-transform">
          {grupa}
        </div>
        <div className="text-white/80 text-sm font-medium">{ageRange || 'Descoperă echipa'}</div>
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
