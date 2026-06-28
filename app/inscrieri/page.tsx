import type { Metadata } from 'next'
import InscrieriForm from './InscrieriForm'

export const metadata: Metadata = {
  title: 'Înscrieri | Dinamo Rugby Juniori',
  description: 'Înscrie-ți copilul la secția de juniori rugby CS Dinamo București. Formular de înscriere online — grupe U10, U12, U14, U16, U18.',
  openGraph: {
    title: 'Înscrieri Rugby Juniori Dinamo București',
    description: 'Înscrie-ți copilul la rugby! Completează formularul online pentru secția de juniori CS Dinamo București.',
    url: 'https://dinamorugby.ro/inscrieri',
    siteName: 'Dinamo Rugby Juniori',
    locale: 'ro_RO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Înscrieri Rugby Juniori Dinamo București',
    description: 'Înscrie-ți copilul la rugby! Completează formularul online.',
  },
}

export default function InscrieriPage() {
  return <InscrieriForm />
}
