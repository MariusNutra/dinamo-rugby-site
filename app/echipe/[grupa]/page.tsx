import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PhotoGrid from '@/components/PhotoGrid'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const validGrupe = ['U10', 'U12', 'U14', 'U16', 'U18']

const grupaColors: Record<string, string> = {
  U10: 'from-green-500 to-green-700',
  U12: 'from-blue-500 to-blue-700',
  U14: 'from-red-600 to-red-900',
  U16: 'from-purple-500 to-purple-700',
  U18: 'from-gray-700 to-gray-900',
}

export default async function TeamPage({ params }: { params: { grupa: string } }) {
  const { grupa } = params
  if (!validGrupe.includes(grupa)) notFound()

  const team = await prisma.team.findUnique({ where: { grupa } })
  const trainingSessions = await prisma.trainingSession.findMany({
    where: { grupa },
    orderBy: { startTime: 'asc' },
  })
  const matches = await prisma.match.findMany({
    where: { grupa },
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
      <section className={`bg-gradient-to-br ${grupaColors[grupa] || 'from-gray-500 to-gray-700'} text-white py-20`}>
        <div className="max-w-7xl mx-auto px-4 text-center fade-in">
          <h1 className="font-heading font-extrabold text-6xl md:text-8xl mb-2">{grupa}</h1>
          <p className="text-xl opacity-90">Echipa de juniori Dinamo Rugby</p>
          <div className="flex justify-center gap-2 mt-6">
            {validGrupe.map(g => (
              <Link key={g} href={`/echipe/${g}`}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${g === grupa ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/30'}`}>
                {g}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {team ? (
          <section className="mb-12">
            <h2 className="font-heading font-bold text-2xl mb-6 text-gray-900">Antrenor</h2>
            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
              {team.coachPhoto ? (
                <img src={team.coachPhoto} alt={team.coachName} className="w-32 h-32 rounded-full object-cover" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl">?</div>
              )}
              <div>
                <h3 className="font-heading font-bold text-xl">{team.coachName}</h3>
                {team.coachBio && <p className="text-gray-600 mt-2">{team.coachBio}</p>}
              </div>
            </div>
          </section>
        ) : (
          <section className="mb-12 bg-gray-50 rounded-xl p-8 text-center text-gray-400">
            <p>Informațiile despre echipă vor fi adăugate în curând.</p>
          </section>
        )}

        {sortedSessions.length > 0 ? (
          <section className="mb-12">
            <h2 className="font-heading font-bold text-2xl mb-6 text-gray-900">Program antrenamente</h2>
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
          </section>
        ) : team?.schedule ? (
          <section className="mb-12">
            <h2 className="font-heading font-bold text-2xl mb-6 text-gray-900">Program antrenamente</h2>
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-700 whitespace-pre-line">{team.schedule}</p>
            </div>
          </section>
        ) : null}

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
              {matches.map(match => (
                <div key={match.id} className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500">{new Date(match.date).toLocaleDateString('ro-RO')}</span>
                    <div className="font-bold text-gray-900 mt-1">Dinamo {grupa} vs {match.opponent}</div>
                    {match.description && <p className="text-sm text-gray-500 mt-1">{match.description}</p>}
                  </div>
                  {match.scoreHome !== null && match.scoreAway !== null && (
                    <div className="text-right">
                      <div className={`text-2xl font-heading font-bold ${match.scoreHome > match.scoreAway ? 'text-green-600' : match.scoreHome < match.scoreAway ? 'text-red-600' : 'text-gray-600'}`}>
                        {match.scoreHome} - {match.scoreAway}
                      </div>
                      <span className="text-xs text-gray-400">
                        {match.scoreHome > match.scoreAway ? 'Victorie' : match.scoreHome < match.scoreAway ? 'Înfrângere' : 'Egal'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
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
