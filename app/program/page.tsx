import { prisma } from '@/lib/prisma'
import { getColorConfig } from '@/lib/team-colors'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const dayOrder: Record<string, number> = {
  'Luni': 1, 'Marți': 2, 'Miercuri': 3, 'Joi': 4, 'Vineri': 5, 'Sâmbătă': 6, 'Duminică': 7,
}

export default async function ProgramPage() {
  const teams = await prisma.team.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } })
  const teamMap = Object.fromEntries(teams.map(t => [t.grupa, t]))
  const grupe = teams.map(t => t.grupa)

  const sessions = await prisma.trainingSession.findMany({
    orderBy: [{ grupa: 'asc' }, { startTime: 'asc' }],
  })

  const sessionsByGrupa = grupe.reduce((acc, g) => {
    const grupaSessions = sessions
      .filter(s => s.grupa === g)
      .sort((a, b) => (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99))
    acc[g] = grupaSessions
    return acc
  }, {} as Record<string, typeof sessions>)

  return (
    <>
      <section className="bg-gradient-to-br from-dinamo-red to-dinamo-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center fade-in">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-3">Program Antrenamente</h1>
          <p className="text-lg opacity-90">Programul săptămânal de antrenamente pentru toate grupele de vârstă</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {grupe.map(grupa => {
          const grupaSessions = sessionsByGrupa[grupa] || []
          const team = teamMap[grupa]
          const colorConfig = getColorConfig(team?.color || 'green')

          return (
            <section key={grupa} className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-2xl text-gray-900">
                  <span className={colorConfig.text}>{grupa}</span>
                  {team && <span className="text-base font-normal text-gray-500 ml-3">Antrenor: {team.coachName}</span>}
                </h2>
                <Link href={`/echipe/${grupa}`}
                  className="text-sm text-dinamo-red hover:underline">
                  Vezi echipa &rarr;
                </Link>
              </div>

              {grupaSessions.length > 0 ? (
                <div className={`rounded-xl border-l-4 ${colorConfig.border} overflow-hidden`}>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Ziua</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Ora</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Locația</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Antrenor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupaSessions.map(session => (
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
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400">
                  Programul de antrenamente va fi adăugat în curând.
                </div>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}
