import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Despre Noi — Dinamo Rugby Juniori',
  description: 'Istoria și valorile secției de juniori rugby CS Dinamo București. 16 titluri de campion, 14 cupe.',
}

export default async function DesprePage() {
  const teams = await prisma.team.findMany({ orderBy: { grupa: 'asc' } })

  return (
    <>
      <section className="bg-gradient-to-br from-dinamo-red to-dinamo-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center fade-in">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-4">Despre Noi</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            O tradiție de excelență în rugby-ul românesc
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Istoria */}
        <section className="mb-16">
          <h2 className="font-heading font-bold text-3xl mb-6 text-dinamo-red">Istoria noastră</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              <strong>CS Dinamo București</strong> este unul dintre cele mai titrate cluburi de rugby din România,
              cu o tradiție care datează din <strong>1949</strong>. De-a lungul deceniilor, Dinamo a cucerit
              <strong> 16 titluri de campion național</strong> și <strong>14 Cupe ale României</strong>,
              consolidându-și poziția de vârf în rugby-ul românesc.
            </p>
            <p>
              Secția de juniori reprezintă fundamentul acestei tradiții. Aici se formează viitorii
              jucători care vor purta cu mândrie tricoul alb-roșu al Dinamoului. Prin programe de
              antrenament adaptate fiecărei grupe de vârstă, de la U10 la U18, oferim tinerilor
              sportivi posibilitatea de a se dezvolta atât fizic, cât și mental.
            </p>
            <p>
              Mulți dintre jucătorii care au evoluat la echipele naționale ale României și-au
              început cariera în secția de juniori a clubului Dinamo București.
            </p>
          </div>
        </section>

        {/* Palmares */}
        <section className="mb-16">
          <h2 className="font-heading font-bold text-3xl mb-6 text-dinamo-red">Palmares</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="text-4xl font-heading font-extrabold text-dinamo-red">16</div>
              <div className="text-sm text-gray-600 mt-1">Titluri de Campion</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="text-4xl font-heading font-extrabold text-dinamo-red">14</div>
              <div className="text-sm text-gray-600 mt-1">Cupe ale României</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="text-4xl font-heading font-extrabold text-dinamo-red">1949</div>
              <div className="text-sm text-gray-600 mt-1">Anul fondării</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="text-4xl font-heading font-extrabold text-dinamo-red">5</div>
              <div className="text-sm text-gray-600 mt-1">Grupe de juniori</div>
            </div>
          </div>
        </section>

        {/* Valori */}
        <section className="mb-16">
          <h2 className="font-heading font-bold text-3xl mb-6 text-dinamo-red">Valorile noastre</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: '🏛️', title: 'Disciplină', desc: 'Respectăm regulile și ne antrenăm cu seriozitate. Disciplina pe teren se reflectă în viața de zi cu zi.' },
              { icon: '🤝', title: 'Respect', desc: 'Respectăm adversarii, arbitrii, antrenorii și colegii. Rugby-ul ne învață să respectăm pe toată lumea.' },
              { icon: '⚖️', title: 'Fair-play', desc: 'Jucăm curat și onest, atât în competiție cât și în afara terenului. Integritatea este fundamentală.' },
              { icon: '❤️', title: 'Pasiune', desc: 'Iubim rugby-ul și transmitem această pasiune generațiilor viitoare. Jucăm cu inima.' },
            ].map(v => (
              <div key={v.title} className="bg-white rounded-xl shadow-md p-6">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="font-heading font-bold text-lg text-gray-900">{v.title}</h3>
                <p className="text-gray-600 mt-2 text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Staff tehnic */}
        <section>
          <h2 className="font-heading font-bold text-3xl mb-6 text-dinamo-red">Staff tehnic</h2>
          {teams.length > 0 ? (
            <div className="space-y-4">
              {teams.map(team => (
                <div key={team.id} className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
                  {team.coachPhoto ? (
                    <img src={team.coachPhoto} alt={team.coachName} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl">👤</div>
                  )}
                  <div>
                    <div className="font-heading font-bold text-gray-900">{team.coachName}</div>
                    <div className="text-sm text-dinamo-red font-medium">Antrenor {team.grupa}</div>
                    {team.coachBio && <p className="text-sm text-gray-500 mt-1">{team.coachBio}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
              <p>Stafful tehnic va fi adăugat în curând.</p>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
