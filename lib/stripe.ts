import Stripe from 'stripe'

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is required')
  return new Stripe(key, { apiVersion: '2026-02-25.clover' })
}

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = getStripeClient()
  }
  return stripeInstance
}

export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || ''

/**
 * Situl e construit pentru Stripe, dar nu exista nicio cheie in `.env` — deci
 * niciun drum de plata nu poate ajunge la capat. Pana se decide furnizorul
 * (Netopia e cel folosit pe celelalte proiecte), fiecare drum trebuie sa spuna
 * asta pe fata.
 *
 * De ce nu e suficient sa lasam eroarea sa iasa singura: `getStripe()` arunca
 * SINCRON, inainte de orice `try`, asa ca Next raspundea 500 cu corpul GOL.
 * Omul din fata ecranului vedea o eroare fara text, iar in magazin comanda
 * apucase deja sa fie scrisa in baza de date — ramanea o comanda „noua" pe care
 * nimeni n-o platise vreodata.
 *
 * 503 e codul corect aici, nu 500: serviciul lipseste, cererea nu e gresita.
 */
export function platileSuntConfigurate(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export const MESAJ_PLATI_INDISPONIBILE =
  'Platile online nu sunt momentan disponibile. Poti plati prin transfer bancar in contul '  +
  'Asociatia Sportiva Dinamo Rugby Junior, IBAN RO77 RNCB 0082 1792 8045 0001 (BCR), '      +
  'sau ne poti scrie la contact@dinamorugby.ro.'

export function raspunsPlatiIndisponibile(): Response {
  return Response.json(
    { error: MESAJ_PLATI_INDISPONIBILE, code: 'payments_not_configured' },
    { status: 503 }
  )
}
