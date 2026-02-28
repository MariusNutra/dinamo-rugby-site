import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Competitii | Dinamo Rugby Juniori',
  description: 'Competitii, turnee si clasamente ale echipelor de rugby juniori Dinamo Bucuresti.',
}

const TYPE_LABELS: Record<string, string> = {
  liga: 'Liga',
  turneu: 'Turneu',
  cupa: 'Cupa',
}

const TYPE_COLORS: Record<string, string> = {
  liga: 'bg-blue-100 text-blue-800',
  turneu: 'bg-green-100 text-green-800',
  cupa: 'bg-amber-100 text-amber-800',
}

export default async function CompetitiiPage() {
  const competitions = await prisma.competition.findMany({
    where: { active: true },
    include: {
      _count: {
        select: { teams: true, matches: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-gray-900 mb-2">
          Competitii
        </h1>
        <p className="text-gray-500">
          Clasamente si rezultate din competitiile in care participa echipele noastre
        </p>
      </div>

      {competitions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-400 text-lg">Nu sunt competitii active momentan.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {competitions.map(comp => (
            <Link
              key={comp.id}
              href={`/competitii/${comp.id}`}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
            >
              {/* Top colored bar */}
              <div className="h-1.5 bg-dinamo-red" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-heading font-bold text-lg text-gray-900 group-hover:text-dinamo-red transition-colors">
                    {comp.name}
                  </h2>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ml-3 ${TYPE_COLORS[comp.type] || 'bg-gray-100 text-gray-800'}`}>
                    {TYPE_LABELS[comp.type] || comp.type}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  {comp.season && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {comp.season}
                    </span>
                  )}
                  {comp.category && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {comp.category}
                    </span>
                  )}
                </div>
                <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  <span>{comp._count.teams} echipe</span>
                  <span>{comp._count.matches} meciuri</span>
                  {comp.startDate && (
                    <span>
                      {new Date(comp.startDate).toLocaleDateString('ro-RO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
