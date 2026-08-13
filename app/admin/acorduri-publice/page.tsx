'use client'

import { useEffect, useState } from 'react'

/**
 * Acordurile venite prin linkul public trimis pe WhatsApp.
 *
 * Sta separat de /admin/acorduri, care urmareste acordurile copiilor DEJA
 * inscrisi si arata cine n-a semnat inca. Aici vin declaratii de la oameni care
 * poate nici nu-s in baza — nu se pot amesteca fara sa se piarda intelesul
 * fiecareia.
 */

type Copil = {
  id: string
  nume: string
  anNastere: number
  grupa: string
  telefon: string | null
  email: string | null
  pozitie: string | null
  pozaUrl: string | null
}

type Acord = {
  id: string
  parinteNume: string
  parinteTelefon: string
  parinteEmail: string
  consimtSite: boolean
  consimtWhatsApp: boolean
  semnatura: string
  createdAt: string
  copii: Copil[]
}

export default function AcorduriPublicePage() {
  const [acorduri, setAcorduri] = useState<Acord[]>([])
  const [seIncarca, setSeIncarca] = useState(true)
  const [eroare, setEroare] = useState('')
  const [deschis, setDeschis] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/acorduri-publice')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setAcorduri)
      .catch(() => setEroare('Nu am putut încărca acordurile.'))
      .finally(() => setSeIncarca(false))
  }, [])

  const linkPublic =
    typeof window !== 'undefined' ? `${window.location.origin}/acord-foto` : '/acord-foto'

  const totalCopii = acorduri.reduce((s, a) => s + a.copii.length, 0)
  const cuAcord = acorduri.filter((a) => a.consimtSite || a.consimtWhatsApp).length
  const refuzuri = acorduri.length - cuAcord

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-heading text-2xl font-bold text-gray-900">Acorduri foto (link public)</h1>
      <p className="mt-1 text-gray-500">Declarațiile primite prin linkul trimis părinților.</p>

      {/* Linkul de dat pe WhatsApp */}
      <div className="mt-6 rounded-lg border-2 border-dinamo-red bg-red-50 p-5">
        <p className="mb-2 text-sm font-semibold text-gray-700">Linkul de trimis părinților:</p>
        <div className="flex flex-wrap items-center gap-3">
          <code className="flex-1 break-all rounded bg-white px-3 py-2 text-sm">{linkPublic}</code>
          <button
            onClick={() => navigator.clipboard?.writeText(linkPublic)}
            className="rounded-full bg-gray-800 px-5 py-2 text-sm font-bold text-white hover:bg-gray-900"
          >
            Copiază
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Bună ziua! Pentru a putea publica pozele de la antrenamente și meciuri, avem nevoie de acordul dumneavoastră. Durează două minute: ${linkPublic}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-700"
          >
            Trimite pe WhatsApp
          </a>
        </div>
      </div>

      {/* Cifre */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Declarații', acorduri.length],
          ['Copii', totalCopii],
          ['Cu acord', cuAcord],
          ['Fără acord', refuzuri],
        ].map(([eticheta, valoare]) => (
          <div key={String(eticheta)} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="font-heading text-2xl font-bold text-gray-900">{valoare}</div>
            <div className="text-sm text-gray-500">{eticheta}</div>
          </div>
        ))}
      </div>

      {acorduri.length > 0 && (
        <a
          href="/api/admin/acorduri-publice/export"
          className="mt-4 inline-block text-sm font-semibold text-dinamo-red underline"
        >
          Descarcă tabel CSV
        </a>
      )}

      {seIncarca && <p className="mt-8 text-gray-500">Se încarcă…</p>}
      {eroare && <p className="mt-8 rounded bg-red-50 p-4 text-red-700">{eroare}</p>}
      {!seIncarca && !eroare && acorduri.length === 0 && (
        <p className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
          Încă nu a trimis nimeni. Trimiteți linkul de mai sus părinților.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {acorduri.map((a) => {
          const esteDeschis = deschis === a.id
          return (
            <div key={a.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => setDeschis(esteDeschis ? null : a.id)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <div className="font-heading font-bold text-gray-900">{a.parinteNume}</div>
                  <div className="truncate text-sm text-gray-500">
                    {a.copii.map((c) => `${c.nume} (${c.grupa})`).join(', ')}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {a.consimtSite && (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">Site</span>
                  )}
                  {a.consimtWhatsApp && (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">WA</span>
                  )}
                  {!a.consimtSite && !a.consimtWhatsApp && (
                    <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">Refuz</span>
                  )}
                  <span className="text-gray-400">{esteDeschis ? '▲' : '▼'}</span>
                </div>
              </button>

              {esteDeschis && (
                <div className="border-t border-gray-200 p-5">
                  <dl className="mb-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="font-bold text-gray-900">Telefon</dt>
                      <dd><a className="text-dinamo-red underline" href={`tel:${a.parinteTelefon}`}>{a.parinteTelefon}</a></dd>
                    </div>
                    <div>
                      <dt className="font-bold text-gray-900">Email</dt>
                      <dd className="break-all"><a className="text-dinamo-red underline" href={`mailto:${a.parinteEmail}`}>{a.parinteEmail}</a></dd>
                    </div>
                    <div>
                      <dt className="font-bold text-gray-900">Trimis</dt>
                      <dd>{new Date(a.createdAt).toLocaleString('ro-RO')}</dd>
                    </div>
                  </dl>

                  <div className="space-y-4">
                    {a.copii.map((c) => (
                      <div key={c.id} className="flex gap-4 rounded border border-gray-200 p-4">
                        {c.pozaUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/api/admin/acorduri-publice/poza/${c.id}`} alt={`Poza lui ${c.nume}`}
                            className="h-28 w-24 flex-shrink-0 rounded border border-gray-300 object-cover" />
                        ) : (
                          <div className="flex h-28 w-24 flex-shrink-0 items-center justify-center rounded border border-dashed border-gray-300 text-center text-xs text-gray-400">
                            fără poză
                          </div>
                        )}
                        <div className="min-w-0 text-sm">
                          <div className="font-heading font-bold text-gray-900">{c.nume}</div>
                          <div className="text-gray-600">{c.grupa} · născut {c.anNastere}</div>
                          {c.pozitie && <div className="text-gray-600">post: {c.pozitie}</div>}
                          {c.telefon && <div className="text-gray-600">tel: {c.telefon}</div>}
                          {c.email && <div className="break-all text-gray-600">{c.email}</div>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5">
                    <div className="mb-1 text-sm font-bold text-gray-900">Semnătura</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.semnatura} alt="Semnătura părintelui"
                      className="h-24 rounded border border-gray-300 bg-white" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
