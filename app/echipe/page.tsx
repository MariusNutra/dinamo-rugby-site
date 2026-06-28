import Link from 'next/link'
import { getActiveTeams } from '@/lib/active-teams'
import TeamCard from '@/components/TeamCard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Echipe Juniori — Dinamo Rugby',
  description:
    'Grupele de juniori ale secției de rugby CS Dinamo București. Alege grupa de vârstă pentru program, antrenori și detalii.',
}

export default async function EchipePage() {
  const teams = await getActiveTeams()

  return (
    <>
      <section className="bg-gradient-to-br from-dinamo-red to-dinamo-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center fade-in">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-4">
            Echipele noastre
          </h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Formăm viitorii campioni ai rugby-ului românesc din 1949. Alege o grupă de vârstă
            pentru program, antrenori și detalii.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {teams.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">
              Momentan nu sunt grupe active. Revino în curând.
            </p>
            <Link
              href="/contact"
              className="inline-block mt-6 bg-dinamo-red text-white font-bold px-6 py-3 rounded-lg hover:bg-dinamo-dark transition-colors"
            >
              Contactează-ne
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                grupa={team.grupa}
                color={team.color}
                ageRange={team.ageRange}
                description={team.description || undefined}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
