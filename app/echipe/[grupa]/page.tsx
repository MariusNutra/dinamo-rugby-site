import { prisma } from '@/lib/prisma'
import { getActiveGrupe } from '@/lib/active-teams'
import { getColorConfig } from '@/lib/team-colors'
import { notFound } from 'next/navigation'
import PhotoGrid from '@/components/PhotoGrid'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { grupa: string } }) {
  const { grupa } = await params
  return {
    title: `Echipa ${grupa} | Dinamo Rugby Juniori`,
    description: `Detalii despre echipa ${grupa} a secției de juniori rugby CS Dinamo București. Antrenori, program și sportivi.`,
  }
}

export default async function TeamPage({ params }: { params: { grupa: string } }) {
  const { grupa } = await params

  const team = await prisma.team.findUnique({
    where: { grupa },
    include: { coaches: { orderBy: { order: 'asc' } } },
  })
  if (!team || !team.active) notFound()

  const activeGrupe = await getActiveGrupe()
  const trainingSessions = await prisma.trainingSession.findMany({
    where: { grupa },
    orderBy: { startTime: 'asc' },
  })
  const matches = await prisma.match.findMany({
    where: { category: grupa, isDinamo: true },
    orderBy: { date: 'desc' },
    take: 10,
  })
  const photos = await prisma.photo.findMany({
    where: { grupa },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  const dayOrder: Record<string, number> = {
    'Luni': 1, 'Marți': 2, 'Miercuri': 3, 'Joi': 4, 'Vineri': 5, 'Sâmbătă': 6, 'Duminică': 7,
  }
  const sortedSessions = [...trainingSessions].sort((a, b) => (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99))

  return (
    <>
      <section className={`bg-gradient-to-br ${getColorConfig(team.color).gradient} text-white py-20`}>
        <div className="max-w-7xl mx-auto px-4 text-center fade-in">
          <h1 className="font-heading font-extrabold text-6xl md:text-8xl mb-2">{grupa}</h1>
          <p className="text-xl opacity-90">Echipa de juniori Dinamo Rugby</p>
          <div className="flex justify-center gap-2 mt-6">
            {activeGrupe.map(g => (
              <Link key={g} href={`/echipe/${g}`}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${g === grupa ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/30'}`}>
                {g}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {team ? (() => {
          const coaches = team.coaches.length > 0
            ? team.coaches
            : team.coachName?.trim()
              ? [{ id: 'legacy', name: team.coachName, description: team.coachBio, photo: team.coachPhoto }]
              : []
          return coaches.length > 0 ? (
            <section className="mb-12">
              <h2 className="font-heading font-bold text-2xl mb-6 text-gray-900">
                {coaches.length === 1 ? 'Antrenor' : 'Antrenori'}
              </h2>
              <div className={`grid gap-6 ${coaches.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                {coaches.map(coach => (
                  <div key={coach.id} className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-center">
                    <div className="w-24 h-24 sm:w-[120px] sm:h-[120px] rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {coach.photo ? (
                        <img src={coach.photo} alt={coach.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">?</div>
                      )}
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-heading font-bold text-xl">{coach.name}</h3>
                      {coach.description && <p className="text-gray-600 mt-2">{coach.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null
        })() : (
          <section className="mb-12 bg-gray-50 rounded-xl p-8 text-center text-gray-400">
            <p>Informațiile despre echipă vor fi adăugate în curând.</p>
          </section>
        )}

        <section className="mb-12">
          <h2 className="font-heading font-bold text-2xl mb-6 text-gray-900">Program antrenamente</h2>
          {sortedSessions.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Ziua</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Ora</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Locația</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Antrenor</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSessions.map(session => (
                    <tr key={session.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-6 py-4 font-medium text-gray-900">{session.day}</td>
                      <td className="px-6 py-4 text-gray-700">{session.startTime} - {session.endTime}</td>
                      <td className="px-6 py-4 text-gray-700">{session.location}</td>
                      <td className="px-6 py-4 text-gray-700">{session.coachName || (team?.coachName ?? '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : team?.schedule ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-700 whitespace-pre-line">{team.schedule}</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <p className="text-gray-500">Programul antrenamentelor va fi publicat în curând.</p>
              <Link href="/contact" className="text-dinamo-red hover:text-dinamo-dark font-medium text-sm mt-2 inline-block">
                Contactează-ne pentru detalii →
              </Link>
            </div>
          )}
        </section>

        {team?.description && (
          <section className="mb-12">
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-700 whitespace-pre-line">{team.description}</p>
            </div>
          </section>
        )}

        <section className="mb-12">
          <h2 className="font-heading font-bold text-2xl mb-6 text-gray-900">Rezultate recente</h2>
          {matches.length > 0 ? (
            <div className="space-y-3">
              {matches.map(match => {
                const isDinamoHome = /dinamo/i.test(match.homeTeam)
                const hasScore = match.homeScore != null && match.awayScore != null
                const dinamoScore = isDinamoHome ? match.homeScore : match.awayScore
                const opponentScore = isDinamoHome ? match.awayScore : match.homeScore
                return (
                  <div key={match.id} className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500">{new Date(match.date).toLocaleDateString('ro-RO')}</span>
                      <div className="font-bold text-gray-900 mt-1">{match.homeTeam} vs {match.awayTeam}</div>
                      {match.round && <p className="text-sm text-gray-500 mt-1">{match.round}</p>}
                    </div>
                    {hasScore && (
                      <div className="text-right">
                        <div className={`text-2xl font-heading font-bold ${
                          dinamoScore! > opponentScore! ? 'text-green-600' :
                          dinamoScore! < opponentScore! ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {match.homeScore} - {match.awayScore}
                        </div>
                        <span className="text-xs text-gray-400">
                          {dinamoScore! > opponentScore! ? 'Victorie' : dinamoScore! < opponentScore! ? 'Înfrângere' : 'Egal'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
              <p>Nu sunt rezultate încă.</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl mb-6 text-gray-900">Galerie foto {grupa}</h2>
          <PhotoGrid photos={photos} />
        </section>
      </div>
    </>
  )
}
