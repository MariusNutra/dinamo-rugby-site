export const metadata = {
  title: 'Despre Noi — Dinamo Rugby Juniori',
  description: 'Istoria și valorile secției de juniori rugby CS Dinamo București. 16 titluri de campion, 14 cupe.',
}

export default function DesprePage() {

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
          <a href="/antrenori" className="block bg-white rounded-xl shadow-md p-8 text-center hover:shadow-lg transition-shadow group">
            <div className="text-4xl mb-3">🏉</div>
            <h3 className="font-heading font-bold text-xl text-gray-900 group-hover:text-dinamo-red transition-colors">
              Vezi staff-ul tehnic
            </h3>
            <p className="text-gray-500 text-sm mt-2">Antrenorii secției de juniori rugby CS Dinamo București</p>
          </a>
        </section>

        {/* Date de identificare asociație */}
        <section className="mt-16">
          <h2 className="font-heading font-bold text-3xl mb-6 text-dinamo-red">Despre asociație</h2>
          <div className="bg-gray-50 border-l-4 border-dinamo-red rounded-r-lg p-6 md:p-8">
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Asociația Sportivă Dinamo Rugby Junior</strong> este o organizație sportivă
              fără scop patrimonial dedicată promovării și dezvoltării rugby-ului în rândul copiilor
              și juniorilor. Asociația are sediul în București, Sector 3, Bd. Camil Ressu nr. 2,
              bl. R1, sc. 1, et. 5, ap. 18 și funcționează pe durată nelimitată. Este înscrisă în
              Registrul Special al persoanelor juridice fără scop patrimonial sub nr. 73/14.05.2024,
              Partea A, Secțiunea I.
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="font-bold text-gray-900">Denumire</dt>
                <dd className="text-gray-600">Asociația Sportivă Dinamo Rugby Junior</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-900">Denumire anterioară</dt>
                <dd className="text-gray-600">Asociația Sportivă Rugby Olimpia</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-900">Formă juridică</dt>
                <dd className="text-gray-600">Asociație sportivă fără scop patrimonial</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-900">Durata de funcționare</dt>
                <dd className="text-gray-600">Nelimitată</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-900">Sediu social</dt>
                <dd className="text-gray-600">Bd. Camil Ressu nr. 2, bl. R1, sc. 1, et. 5, ap. 18, Sector 3, București</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-900">Registrul Special</dt>
                <dd className="text-gray-600">Nr. 73/14.05.2024, Partea A, Secțiunea I</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </>
  )
}
