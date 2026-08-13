'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * Tabelul acordurilor venite prin linkul public.
 *
 * Un rand per COPIL, nu per declaratie. Un parinte cu doi copii trimite o
 * singura data, dar clubul lucreaza cu copii: cine e in U12, cine are poza,
 * cine n-a dat acord. Cu un rand per declaratie, al doilea copil s-ar ascunde
 * intr-o celula si n-ar putea fi nici cautat, nici sortat.
 *
 * Sta separat de /admin/acorduri, care urmareste copiii DEJA inscrisi si arata
 * cine n-a semnat. Aici vin declaratii de la oameni care poate nici nu-s inca
 * in baza.
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
  consimtFacebook: boolean
  consimtInstagram: boolean
  consimtTikTok: boolean
  consimtWhatsApp: boolean
  semnatura: string
  createdAt: string
  copii: Copil[]
}

/** Un rand de tabel: copilul, plus datele declaratiei din care vine. */
type Rand = Copil & { acord: Acord }

type Coloana = 'data' | 'copil' | 'grupa' | 'parinte'

export default function AcorduriPublicePage() {
  const [acorduri, setAcorduri] = useState<Acord[]>([])
  const [seIncarca, setSeIncarca] = useState(true)
  const [eroare, setEroare] = useState('')
  const [cauta, setCauta] = useState('')
  const [sortare, setSortare] = useState<Coloana>('data')
  const [crescator, setCrescator] = useState(false)
  const [detaliu, setDetaliu] = useState<Rand | null>(null)
  const [editare, setEditare] = useState<Rand | null>(null)
  const [form, setForm] = useState<Record<string, string | boolean>>({})
  const [seSalveaza, setSeSalveaza] = useState(false)
  const [mesaj, setMesaj] = useState('')

  useEffect(() => {
    fetch('/api/admin/acorduri-publice')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setAcorduri)
      .catch(() => setEroare('Nu am putut încărca acordurile.'))
      .finally(() => setSeIncarca(false))
  }, [])

  const randuri: Rand[] = useMemo(
    () => acorduri.flatMap((a) => a.copii.map((c) => ({ ...c, acord: a }))),
    [acorduri]
  )

  const randuriFiltrate = useMemo(() => {
    const q = cauta.trim().toLowerCase()
    const lista = q
      ? randuri.filter((r) =>
          [r.nume, r.grupa, r.pozitie, r.telefon, r.email,
           r.acord.parinteNume, r.acord.parinteTelefon, r.acord.parinteEmail]
            .some((v) => (v ?? '').toLowerCase().includes(q))
        )
      : randuri

    const cheie = (r: Rand) =>
      sortare === 'data' ? r.acord.createdAt
        : sortare === 'copil' ? r.nume.toLowerCase()
        : sortare === 'grupa' ? r.grupa
        : r.acord.parinteNume.toLowerCase()

    return [...lista].sort((a, b) => {
      const x = cheie(a), y = cheie(b)
      const cmp = x < y ? -1 : x > y ? 1 : 0
      return crescator ? cmp : -cmp
    })
  }, [randuri, cauta, sortare, crescator])

  function reincarca() {
    return fetch('/api/admin/acorduri-publice')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setAcorduri)
      .catch(() => setEroare('Nu am putut reîncărca lista.'))
  }

  function deschideEditarea(r: Rand) {
    setEditare(r)
    setMesaj('')
    setForm({
      nume: r.nume,
      anNastere: String(r.anNastere),
      grupa: r.grupa,
      pozitie: r.pozitie ?? '',
      telefon: r.telefon ?? '',
      email: r.email ?? '',
      parinteNume: r.acord.parinteNume,
      parinteTelefon: r.acord.parinteTelefon,
      parinteEmail: r.acord.parinteEmail,
      consimtSite: r.acord.consimtSite,
      consimtFacebook: r.acord.consimtFacebook,
      consimtInstagram: r.acord.consimtInstagram,
      consimtTikTok: r.acord.consimtTikTok,
      consimtWhatsApp: r.acord.consimtWhatsApp,
    })
  }

  async function salveaza() {
    if (!editare) return
    setSeSalveaza(true)
    setMesaj('')
    try {
      const raspuns = await fetch(`/api/admin/acorduri-publice/${editare.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, anNastere: Number(form.anNastere) }),
      })
      const date = await raspuns.json().catch(() => ({}))
      if (!raspuns.ok) {
        setMesaj(date.error || 'Salvarea nu a reușit.')
        return
      }
      await reincarca()
      setEditare(null)
    } catch {
      setMesaj('Conexiune întreruptă.')
    } finally {
      setSeSalveaza(false)
    }
  }

  async function sterge(r: Rand) {
    const altii = r.acord.copii.length - 1
    const avertisment = altii === 0
      ? `Ștergi declarația lui ${r.acord.parinteNume} pentru ${r.nume}, împreună cu poza și semnătura. Nu se poate reface.`
      : `Ștergi intrarea pentru ${r.nume} (și poza lui). Declarația rămâne, cu ceilalți ${altii} ${altii === 1 ? 'copil' : 'copii'}. Nu se poate reface.`
    if (!confirm(avertisment)) return

    const raspuns = await fetch(`/api/admin/acorduri-publice/${r.id}`, { method: 'DELETE' })
    if (!raspuns.ok) {
      setEroare('Ștergerea nu a reușit.')
      return
    }
    setDetaliu(null)
    await reincarca()
  }

  function sorteazaDupa(col: Coloana) {
    if (sortare === col) setCrescator((v) => !v)
    else { setSortare(col); setCrescator(col !== 'data') }
  }

  const linkPublic =
    typeof window !== 'undefined' ? `${window.location.origin}/acord-foto` : '/acord-foto'

  const areVreunAcord = (a: Acord) =>
    a.consimtSite || a.consimtFacebook || a.consimtInstagram || a.consimtTikTok || a.consimtWhatsApp
  const cuAcord = randuri.filter((r) => areVreunAcord(r.acord)).length
  const cuPoza = randuri.filter((r) => r.pozaUrl).length

  const th = 'px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500'
  const thSort = `${th} cursor-pointer select-none hover:text-dinamo-red`
  const td = 'px-3 py-2.5 text-sm text-gray-700 whitespace-nowrap'
  const campEdit = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-dinamo-red focus:ring-2 focus:ring-dinamo-red/30'
  /** Insignele de acord, in ordinea in care apar si in formular. */
  const insigne = (a: Acord) => [
    ['Sit', a.consimtSite],
    ['FB', a.consimtFacebook],
    ['IG', a.consimtInstagram],
    ['TT', a.consimtTikTok],
    ['WA', a.consimtWhatsApp],
  ].filter(([, da]) => da).map(([e]) => e as string)

  const sageata = (col: Coloana) => (sortare === col ? (crescator ? ' ▲' : ' ▼') : '')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-heading text-2xl font-bold text-gray-900">Acorduri foto</h1>
      <p className="mt-1 text-gray-500">Declarațiile primite prin linkul trimis părinților.</p>

      {/* Linkul */}
      <div className="mt-6 rounded-lg border-2 border-dinamo-red bg-red-50 p-5">
        <p className="mb-2 text-sm font-semibold text-gray-700">Linkul de trimis părinților:</p>
        <div className="flex flex-wrap items-center gap-3">
          <code className="flex-1 break-all rounded bg-white px-3 py-2 text-sm">{linkPublic}</code>
          <button onClick={() => navigator.clipboard?.writeText(linkPublic)}
            className="rounded-full bg-gray-800 px-5 py-2 text-sm font-bold text-white hover:bg-gray-900">
            Copiază
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(
              `Bună ziua! Pentru a putea publica pozele de la antrenamente și meciuri, avem nevoie de acordul dumneavoastră. Durează două minute: ${linkPublic}`
            )}`} target="_blank" rel="noopener noreferrer"
            className="rounded-full bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-700">
            Trimite pe WhatsApp
          </a>
        </div>
      </div>

      {/* Cifre */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Declarații', acorduri.length],
          ['Copii', randuri.length],
          ['Cu acord', cuAcord],
          ['Cu poză', cuPoza],
        ].map(([eticheta, valoare]) => (
          <div key={String(eticheta)} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="font-heading text-2xl font-bold text-gray-900">{valoare}</div>
            <div className="text-sm text-gray-500">{eticheta}</div>
          </div>
        ))}
      </div>

      {/* Cautare + export */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={cauta}
          onChange={(e) => setCauta(e.target.value)}
          placeholder="Caută după copil, părinte, grupă, telefon…"
          className="min-w-[260px] flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-dinamo-red focus:ring-2 focus:ring-dinamo-red/30"
        />
        {randuri.length > 0 && (
          <a href="/api/admin/acorduri-publice/export"
            className="rounded-full border-2 border-gray-300 px-5 py-2 text-sm font-bold text-gray-700 hover:border-dinamo-red hover:text-dinamo-red">
            Descarcă CSV
          </a>
        )}
      </div>

      {seIncarca && <p className="mt-8 text-gray-500">Se încarcă…</p>}
      {eroare && <p className="mt-8 rounded bg-red-50 p-4 text-red-700">{eroare}</p>}

      {!seIncarca && !eroare && randuri.length === 0 && (
        <p className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
          Încă nu a trimis nimeni. Trimiteți linkul de mai sus părinților.
        </p>
      )}

      {randuri.length > 0 && (
        <>
          <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className={thSort} onClick={() => sorteazaDupa('data')}>Data{sageata('data')}</th>
                  <th className={thSort} onClick={() => sorteazaDupa('copil')}>Copil{sageata('copil')}</th>
                  <th className={thSort} onClick={() => sorteazaDupa('grupa')}>Grupa{sageata('grupa')}</th>
                  <th className={th}>An</th>
                  <th className={th}>Post</th>
                  <th className={thSort} onClick={() => sorteazaDupa('parinte')}>Părinte{sageata('parinte')}</th>
                  <th className={th}>Telefon</th>
                  <th className={th}>Acord</th>
                  <th className={th}>Poză</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {randuriFiltrate.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className={`${td} text-gray-500`}>
                      {new Date(r.acord.createdAt).toLocaleDateString('ro-RO')}
                    </td>
                    <td className={`${td} font-semibold text-gray-900`}>{r.nume}</td>
                    <td className={td}>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold">{r.grupa}</span>
                    </td>
                    <td className={td}>{r.anNastere}</td>
                    <td className={`${td} text-gray-500`}>{r.pozitie || '—'}</td>
                    <td className={td}>{r.acord.parinteNume}</td>
                    <td className={td}>
                      <a href={`tel:${r.acord.parinteTelefon}`} className="text-dinamo-red hover:underline">
                        {r.acord.parinteTelefon}
                      </a>
                    </td>
                    <td className={td}>
                      {areVreunAcord(r.acord) ? (
                        <span className="flex flex-wrap gap-1">
                          {insigne(r.acord).map((i) => (
                            <span key={i} className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-bold text-green-800">{i}</span>
                          ))}
                        </span>
                      ) : (
                        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-bold text-gray-700">Refuz</span>
                      )}
                    </td>
                    <td className={td}>{r.pozaUrl ? '✓' : '—'}</td>
                    <td className={td}>
                      <div className="flex gap-3">
                        <button onClick={() => setDetaliu(r)}
                          className="text-sm font-semibold text-dinamo-red underline hover:text-dinamo-dark">
                          Vezi
                        </button>
                        <button onClick={() => deschideEditarea(r)}
                          className="text-sm font-semibold text-gray-600 underline hover:text-dinamo-red">
                          Editează
                        </button>
                        <button onClick={() => sterge(r)}
                          className="text-sm font-semibold text-gray-400 underline hover:text-red-600">
                          Șterge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {randuriFiltrate.length === 0 && (
            <p className="mt-4 text-center text-gray-500">Niciun rezultat pentru „{cauta}”.</p>
          )}
          <p className="mt-3 text-sm text-gray-500">
            {randuriFiltrate.length} din {randuri.length} copii
          </p>
        </>
      )}

      {/* Editarea */}
      {editare && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
          onClick={() => setEditare(null)}>
          <div className="mt-10 w-full max-w-lg rounded-lg bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <h2 className="font-heading text-xl font-bold text-gray-900">Editează intrarea</h2>
              <button onClick={() => setEditare(null)} className="text-2xl leading-none text-gray-400 hover:text-gray-700">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 text-sm font-bold text-gray-900">Copil</div>
                <div className="space-y-3">
                  <input className={campEdit} placeholder="Nume" value={String(form.nume ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, nume: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <input className={campEdit} type="number" placeholder="An naștere" value={String(form.anNastere ?? '')}
                      onChange={(e) => setForm((f) => ({ ...f, anNastere: e.target.value }))} />
                    <select className={campEdit} value={String(form.grupa ?? '')}
                      onChange={(e) => setForm((f) => ({ ...f, grupa: e.target.value }))}>
                      {['U8','U10','U12','U14','U16','U18','Nu știu'].map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <select className={campEdit} value={String(form.pozitie ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, pozitie: e.target.value }))}>
                    <option value="">Fără post</option>
                    {['Pilier','Taloner','Linia a doua','Flanker','Number 8','Mijlocaș la grămadă','Mijlocaș la deschidere','Centru','Aripă','Fundaș','Nu știu / joacă mai multe']
                      .map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input className={campEdit} placeholder="Telefon copil" value={String(form.telefon ?? '')}
                      onChange={(e) => setForm((f) => ({ ...f, telefon: e.target.value }))} />
                    <input className={campEdit} placeholder="Email copil" value={String(form.email ?? '')}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm font-bold text-gray-900">Părinte</div>
                {editare.acord.copii.length > 1 && (
                  <p className="mb-2 text-xs text-amber-700">
                    Datele părintelui și acordul sunt comune celor {editare.acord.copii.length} copii din
                    această declarație — se schimbă pentru toți.
                  </p>
                )}
                <div className="space-y-3">
                  <input className={campEdit} placeholder="Nume părinte" value={String(form.parinteNume ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, parinteNume: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <input className={campEdit} placeholder="Telefon" value={String(form.parinteTelefon ?? '')}
                      onChange={(e) => setForm((f) => ({ ...f, parinteTelefon: e.target.value }))} />
                    <input className={campEdit} placeholder="Email" value={String(form.parinteEmail ?? '')}
                      onChange={(e) => setForm((f) => ({ ...f, parinteEmail: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-bold text-gray-900">Ce a permis</div>
                {/* Aici bifele SUNT separate pe platforma, desi in formular
                    parintele a bifat „platformele" dintr-o data: cand cineva
                    suna si spune „pe TikTok nu", trebuie sa se poata scoate
                    doar aia, fara sa-i cerem sa reia tot formularul. */}
                {[
                  ['consimtSite', 'Situl clubului'],
                  ['consimtFacebook', 'Facebook'],
                  ['consimtInstagram', 'Instagram'],
                  ['consimtTikTok', 'TikTok'],
                  ['consimtWhatsApp', 'Grupuri WhatsApp'],
                ].map(([cheie, eticheta]) => (
                  <label key={cheie} className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" className="h-4 w-4 accent-red-600" checked={form[cheie] === true}
                      onChange={(e) => setForm((f) => ({ ...f, [cheie]: e.target.checked }))} />
                    {eticheta}
                  </label>
                ))}
              </div>

              {/* Semnatura ramane cea data de parinte. Daca se schimba numele de
                  langa ea, dovada nu mai atesta acelasi lucru — de aceea o
                  spunem, nu o ascundem. */}
              <p className="rounded bg-amber-50 p-3 text-xs text-amber-800">
                Semnătura rămâne cea dată de părinte, la {new Date(editare.acord.createdAt).toLocaleString('ro-RO')}.
                Dacă schimbați numele, semnătura nu mai atestă exact ce s-a semnat atunci.
              </p>

              {mesaj && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{mesaj}</p>}

              <div className="flex gap-3">
                <button onClick={salveaza} disabled={seSalveaza}
                  className="flex-1 rounded-full bg-dinamo-red py-3 font-heading font-bold text-white hover:bg-dinamo-dark disabled:opacity-50">
                  {seSalveaza ? 'Se salvează…' : 'Salvează'}
                </button>
                <button onClick={() => setEditare(null)}
                  className="rounded-full border-2 border-gray-300 px-6 py-3 font-heading font-bold text-gray-700 hover:border-gray-400">
                  Renunță
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detaliul: poza si semnatura, care n-au ce cauta intr-o celula de tabel */}
      {detaliu && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
          onClick={() => setDetaliu(null)}>
          <div className="mt-10 w-full max-w-lg rounded-lg bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold text-gray-900">{detaliu.nume}</h2>
                <p className="text-sm text-gray-500">
                  {detaliu.grupa} · născut {detaliu.anNastere}
                  {detaliu.pozitie ? ` · ${detaliu.pozitie}` : ''}
                </p>
              </div>
              <button onClick={() => setDetaliu(null)} className="text-2xl leading-none text-gray-400 hover:text-gray-700">×</button>
            </div>

            <div className="flex gap-4">
              {detaliu.pozaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/admin/acorduri-publice/poza/${detaliu.id}`} alt={`Poza lui ${detaliu.nume}`}
                  className="h-40 w-32 flex-shrink-0 rounded border border-gray-300 object-cover" />
              ) : (
                <div className="flex h-40 w-32 flex-shrink-0 items-center justify-center rounded border border-dashed border-gray-300 text-center text-xs text-gray-400">
                  fără poză
                </div>
              )}
              <dl className="min-w-0 space-y-2 text-sm">
                <div>
                  <dt className="font-bold text-gray-900">Părinte</dt>
                  <dd>{detaliu.acord.parinteNume}</dd>
                  <dd><a className="text-dinamo-red underline" href={`tel:${detaliu.acord.parinteTelefon}`}>{detaliu.acord.parinteTelefon}</a></dd>
                  <dd className="break-all"><a className="text-dinamo-red underline" href={`mailto:${detaliu.acord.parinteEmail}`}>{detaliu.acord.parinteEmail}</a></dd>
                </div>
                {(detaliu.telefon || detaliu.email) && (
                  <div>
                    <dt className="font-bold text-gray-900">Copil</dt>
                    {detaliu.telefon && <dd>{detaliu.telefon}</dd>}
                    {detaliu.email && <dd className="break-all">{detaliu.email}</dd>}
                  </div>
                )}
                <div>
                  <dt className="font-bold text-gray-900">Trimis</dt>
                  <dd>{new Date(detaliu.acord.createdAt).toLocaleString('ro-RO')}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-5 rounded border border-gray-200 p-3">
              <div className="mb-2 text-sm font-bold text-gray-900">Ce a permis</div>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>{detaliu.acord.consimtSite ? '✓' : '✗'} Situl clubului</li>
                <li>{detaliu.acord.consimtFacebook ? '✓' : '✗'} Facebook</li>
                <li>{detaliu.acord.consimtInstagram ? '✓' : '✗'} Instagram</li>
                <li>{detaliu.acord.consimtTikTok ? '✓' : '✗'} TikTok</li>
                <li>{detaliu.acord.consimtWhatsApp ? '✓' : '✗'} Grupuri WhatsApp</li>
              </ul>
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => { const r = detaliu; setDetaliu(null); deschideEditarea(r) }}
                className="rounded-full border-2 border-gray-300 px-5 py-2 text-sm font-bold text-gray-700 hover:border-dinamo-red hover:text-dinamo-red">
                Editează
              </button>
              <button onClick={() => sterge(detaliu)}
                className="rounded-full border-2 border-gray-200 px-5 py-2 text-sm font-bold text-gray-500 hover:border-red-400 hover:text-red-600">
                Șterge
              </button>
            </div>

            <div className="mt-4">
              <div className="mb-1 text-sm font-bold text-gray-900">Semnătura</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={detaliu.acord.semnatura} alt="Semnătura părintelui"
                className="h-24 rounded border border-gray-300 bg-white" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
