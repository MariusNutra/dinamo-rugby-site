import Link from 'next/link'
import { InstalareClient } from './InstalareClient'

export const metadata = {
  title: 'Instalează aplicația — Dinamo Rugby Juniori',
  description:
    'Cum pui aplicația Dinamo Rugby pe ecranul telefonului: pași pentru iPhone și pentru Android. Program, prezențe, mesaje și evaluări, la îndemână.',
}

export default function AplicatiePage() {
  return (
    <>
      <section className="bg-gradient-to-br from-dinamo-red to-dinamo-dark text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-4">
            Aplicația pe telefonul tău
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Programul antrenamentelor, prezența copilului, mesajele cu antrenorul
            și evaluările — într-un singur loc.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <InstalareClient />

        <section className="rounded-xl bg-dinamo-light p-6">
          <h2 className="font-heading font-bold text-xl mb-3 text-gray-900">
            Întrebări care apar des
          </h2>
          <dl className="space-y-4 text-gray-700">
            <div>
              <dt className="font-semibold">Se descarcă din App Store?</dt>
              <dd>
                Nu. Aplicația se adaugă direct de pe site, cu pașii de mai sus.
                Nu ocupă loc și se actualizează singură.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Nu am primit parola.</dt>
              <dd>
                Intră pe{' '}
                <a
                  href="https://app.dinamorugby.ro"
                  className="text-dinamo-red font-semibold hover:underline"
                >
                  app.dinamorugby.ro
                </a>{' '}
                și apasă „Ai uitat parola?". Primești un link pe emailul cu care
                ești înscris la club.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Am doi copii la club.</dt>
              <dd>
                Amândoi apar în aplicație. Comuți între ei din butoanele cu
                prenumele, sus, iar programul și prezența se schimbă odată cu
                alegerea.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Nu merge ceva.</dt>
              <dd>
                Scrie-ne pe{' '}
                <Link
                  href="/contact"
                  className="text-dinamo-red font-semibold hover:underline"
                >
                  pagina de contact
                </Link>
                .
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  )
}
