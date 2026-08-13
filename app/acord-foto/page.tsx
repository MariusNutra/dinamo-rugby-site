import AcordFotoForm from './AcordFotoForm'

/**
 * Grupele oferite in formular sunt o lista fixa, nu grupele active de pe sit.
 *
 * Paginile de echipe arata doar grupele care functioneaza acum (la 13.08.2026:
 * U10, U12, U16). Dar acordul se strange si de la parinti ai caror copii sunt
 * la o grupa care inca nu are pagina, sau care tocmai se formeaza. Daca lista
 * ar veni din baza, acei parinti n-ar avea ce bifa si ar alege ceva gresit doar
 * ca sa poata trimite.
 */
const GRUPE = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18'] as const

export const metadata = {
  title: 'Acord pentru fotografii — Dinamo Rugby Juniori',
  description:
    'Formular de consimtamant pentru publicarea fotografiilor cu copiii din secția de juniori.',
  // Linkul circula pe WhatsApp, intre parinti. N-are ce cauta in Google: pagina
  // nu spune nimic public util si strange date personale despre minori.
  robots: { index: false, follow: false },
}

export default function AcordFotoPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-dinamo-red to-dinamo-dark py-14 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="font-heading text-3xl font-extrabold md:text-4xl">
            Acord pentru fotografii
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-white/90">
            Ne trebuie acordul dumneavoastră ca să putem publica pozele de la antrenamente și meciuri.
          </p>
        </div>
      </section>

      <AcordFotoForm grupe={[...GRUPE]} />
    </>
  )
}
