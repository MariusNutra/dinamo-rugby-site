import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sportivi | CS Dinamo București Rugby',
  description: 'Descoperă sportivii clubului CS Dinamo București Rugby.',
}

export default async function SportiviPage() {
  const athletes = await prisma.child.findMany({
    where: {
      publicProfile: true,
      photoConsent: true,
    },
    select: {
      id: true,
      name: true,
      birthYear: true,
      publicBio: true,
      team: {
        select: { id: true, grupa: true },
      },
      childPhotos: {
        select: { url: true },
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          attendances: { where: { present: true } },
          evaluations: true,
        },
      },
    },
    orderBy: [{ team: { sortOrder: 'asc' } }, { name: 'asc' }],
  })

  // Group by team
  const teamGroups: Record<string, typeof athletes> = {}
  for (const a of athletes) {
    const teamName = a.team?.grupa || 'Fără echipă'
    if (!teamGroups[teamName]) teamGroups[teamName] = []
    teamGroups[teamName].push(a)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-dinamo-red to-red-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Sportivii Noștri</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Descoperă tinerii rugbiști ai clubului CS Dinamo București
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {athletes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏉</span>
            </div>
            <h2 className="font-heading font-bold text-xl text-gray-600 mb-2">Profiluri în curând</h2>
            <p className="text-gray-400">Profilurile publice ale sportivilor vor fi disponibile în curând.</p>
          </div>
        ) : (
          Object.entries(teamGroups).map(([teamName, members]) => (
            <div key={teamName} className="mb-12">
              <h2 className="font-heading font-bold text-2xl text-dinamo-blue mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-dinamo-red rounded-full inline-block" />
                {teamName}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {members.map(athlete => {
                  const initials = athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                  return (
                    <Link
                      key={athlete.id}
                      href={`/sportivi/${athlete.id}`}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 text-center group"
                    >
                      {athlete.childPhotos[0]?.url ? (
                        <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={athlete.childPhotos[0].url}
                            alt={athlete.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-dinamo-red text-white flex items-center justify-center text-xl font-bold">
                          {initials}
                        </div>
                      )}
                      <h3 className="font-heading font-bold text-sm text-gray-900 group-hover:text-dinamo-red transition-colors">
                        {athlete.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Născut {athlete.birthYear}
                      </p>
                      <div className="flex justify-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{athlete._count.attendances} prezențe</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
