import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Parteneri — Dinamo Rugby Juniori',
  description:
    'Instituțiile și oamenii care sprijină secția de juniori și programul social prin care copii aflați în dificultate ajung la școală și la antrenament.',
}

/**
 * Partenerii NU sunt sponsori, si de-aia stau pe alta pagina.
 *
 * `/sponsori` vinde vizibilitate: pachete gold/silver/bronze, logo pe tricou,
 * postari dedicate. Aici e vorba de institutii care dau fara sa ceara ecran —
 * si de ce se face cu ce dau. Amestecate, primele ar parea cumparate si a doua
 * ar parea reclama.
 *
 * Sigla fiecarui partener se pune in `public/images/parteneri/`. Cat timp
 * fisierul lipseste, `logo: null` scoate in loc un monogram tipografic — un
 * dreptunghi gri cu „lipseste sigla" ar arata a pagina neterminata, cand de
 * fapt parteneriatul e cat se poate de real.
 */
type Partener = {
  nume: string
  scurt: string
  logo: string | null
  site: string | null
  monogram: string
  descriere: string
}

const PARTENERI: Partener[] = [
  {
    nume: 'Colegiul Național „Aurel Vlaicu”',
    scurt: 'CNAV',
    logo: '/images/parteneri/cnav.png',
    site: 'https://www.cnav.ro/',
    monogram: 'CNAV',
    descriere:
      'Colegiul sprijină constant secția de juniori prin donații și ne este alături în programul prin care copii aflați în dificultate ajung la școală și rămân acolo.',
  },
]

export default function ParteneriPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-dinamo-red to-dinamo-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center fade-in">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-4">Parteneri</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Oameni și instituții fără de care jumătate din ce facem nu s-ar face
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Partenerii propriu-zisi */}
        <section className="mb-16">
          <h2 className="font-heading font-bold text-3xl mb-6 text-dinamo-red">Cine ne sprijină</h2>

          <div className="space-y-6">
            {PARTENERI.map((p) => (
              <div
                key={p.nume}
                className="flex flex-col sm:flex-row sm:items-start gap-6 rounded-r-lg border-l-4 border-dinamo-red bg-gray-50 p-6 md:p-8"
              >
                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
                  {p.logo ? (
                    <Image
                      src={p.logo}
                      alt={`Sigla ${p.nume}`}
                      width={148}
                      height={192}
                      className="h-20 w-auto max-w-[80px] object-contain"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="font-heading text-xl font-extrabold tracking-tight text-dinamo-red"
                    >
                      {p.monogram}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="font-heading text-xl font-bold text-gray-900">{p.nume}</h3>
                  <p className="text-sm font-semibold uppercase tracking-wider text-gray-400 mt-0.5">
                    {p.scurt}
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-3">{p.descriere}</p>
                  {p.site && (
                    <a
                      href={p.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-sm font-semibold text-dinamo-red underline underline-offset-4 hover:text-dinamo-dark"
                    >
                      Vezi site-ul
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Programul social — partea grea, si de-aia are greutate pe pagina */}
        <section className="mb-16">
          <h2 className="font-heading font-bold text-3xl mb-6 text-dinamo-red">
            Rugby-ul ca motiv să te întorci la școală
          </h2>

          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              Pe lângă antrenamente și competiții, clubul lucrează cu copii aflați în situații
              dificile — copii care au ieșit din sistemul de învățământ sau care erau pe cale
              să iasă. Îi aducem înapoi la școală, le acoperim mesele și costurile care altfel
              i-ar opri, și îi ținem aproape prin sport.
            </p>
            <p>
              Terenul e partea vizibilă. Sub ea stă lucrul care contează cu adevărat: un copil
              care vine la antrenament vine și a doua zi la ore. Ritmul, echipa și faptul că
              cineva îl așteaptă fac, în multe cazuri, mai mult decât orice discurs despre
              importanța educației.
            </p>
            <p>
              Nu publicăm nume, fotografii sau detalii despre copiii din program. Sunt minori
              în situații delicate, iar demnitatea lor nu e monedă de imagine.
            </p>
          </div>
        </section>

        {/* Cum se intra in poveste */}
        <section>
          <h2 className="font-heading font-bold text-3xl mb-6 text-dinamo-red">
            Vrei să fii alături de noi?
          </h2>

          <div className="rounded-lg border-2 border-dinamo-red bg-red-50 p-6 md:p-8">
            <p className="text-gray-700 leading-relaxed mb-6">
              Sprijinul poate fi de orice fel: bani pentru mese și echipament, transport,
              rechizite, sau pur și simplu timp. Scrie-ne și găsim împreună forma potrivită.
            </p>

            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm mb-6">
              <div className="sm:col-span-2">
                <dt className="font-bold text-gray-900">Beneficiar</dt>
                <dd className="text-gray-700">Asociația Sportivă Dinamo Rugby Junior</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-900">CIF</dt>
                <dd className="text-gray-700">50227280</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-bold text-gray-900">IBAN</dt>
                <dd className="font-mono tracking-tight text-gray-900">RO77 RNCB 0082 1792 8045 0001</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-900">Banca</dt>
                <dd className="text-gray-700">BCR</dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/contact"
                className="rounded-full bg-dinamo-red px-8 py-3 font-heading font-bold text-white shadow-lg shadow-dinamo-red/25 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Scrie-ne
              </Link>
              <Link
                href="/sponsori"
                className="border-b border-gray-400 pb-0.5 font-heading font-semibold text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
              >
                Sponsorizare cu vizibilitate
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
