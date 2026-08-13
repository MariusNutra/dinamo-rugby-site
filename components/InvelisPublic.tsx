'use client'

import { usePathname } from 'next/navigation'

/**
 * Antetul, subsolul si benzile sitului public — ascunse in CRM.
 *
 * Pana acum, layout-ul radacina le punea in jurul TUTUROR paginilor, deci si in
 * jurul panoului de administrare: sub tabelele din CRM aparea subsolul cu
 * „Link-uri rapide" si retelele sociale, iar deasupra meniul public. Doua
 * navigatii una peste alta, dintre care una n-are ce cauta acolo.
 *
 * Header si Footer sunt componente de server; sosesc ca `ReactNode` deja
 * randate, nu ca importuri — asa se poate lua decizia in client, dupa adresa,
 * fara ca ele sa devina componente de client.
 */
export default function InvelisPublic({
  antet,
  subsol,
  benzi,
  children,
}: {
  antet: React.ReactNode
  subsol: React.ReactNode
  benzi: React.ReactNode
  children: React.ReactNode
}) {
  const cale = usePathname() ?? ''
  const inCrm = cale === '/admin' || cale.startsWith('/admin/')

  if (inCrm) {
    // CRM-ul isi are propriul meniu si propria structura, in app/admin/layout.
    return <>{children}</>
  }

  return (
    <>
      {antet}
      <main className="min-h-screen">{children}</main>
      {subsol}
      {benzi}
    </>
  )
}
