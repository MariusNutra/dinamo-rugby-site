import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inregistrare Antrenor — CS Dinamo București Rugby',
  description: 'Creeaza-ti contul de antrenor pentru a accesa portalul echipei Dinamo Rugby. Gestioneaza sportivii, prezenta si antrenamentele.',
  openGraph: {
    title: 'Portal Antrenori — Dinamo Rugby',
    description: 'Inregistreaza-te ca antrenor Dinamo Rugby. Acces la program, sportivi, prezenta si meciuri.',
    url: 'https://dinamorugby.ro/antrenor/inregistrare',
    siteName: 'CS Dinamo București Rugby',
    images: [
      {
        url: 'https://dinamorugby.ro/images/dinamo-rugby-bulldog.png',
        width: 200,
        height: 200,
        alt: 'Dinamo Rugby',
      },
    ],
    locale: 'ro_RO',
    type: 'website',
  },
}

export default function InregistrareLayout({ children }: { children: React.ReactNode }) {
  return children
}
