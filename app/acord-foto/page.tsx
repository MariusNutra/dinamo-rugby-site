import { getActiveGrupe } from '@/lib/active-teams'
import AcordFotoForm from './AcordFotoForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Acord pentru fotografii — Dinamo Rugby Juniori',
  description:
    'Formular de consimtamant pentru publicarea fotografiilor cu copiii din secția de juniori.',
  // Linkul circula pe WhatsApp, intre parinti. N-are ce cauta in Google: pagina
  // nu spune nimic public util si strange date personale despre minori.
  robots: { index: false, follow: false },
}

export default async function AcordFotoPage() {
  let grupe: string[] = []
  try {
    grupe = await getActiveGrupe()
  } catch {
    grupe = []
  }

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

      <AcordFotoForm grupe={grupe} />
    </>
  )
}
