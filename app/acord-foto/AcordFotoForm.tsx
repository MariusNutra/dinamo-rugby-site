'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/**
 * Formularul public de acord pentru imagine, trimis parintilor pe WhatsApp.
 *
 * Doua lucruri au dictat forma lui:
 *
 * 1. Se completeaza de pe telefon, in picioare, probabil intre doua treburi.
 *    De aceea campurile sunt mari, tastatura potrivita se deschide singura
 *    (`inputMode`, `type`), iar poza se poate face direct cu camera.
 *
 * 2. Pozele se micsoreaza IN BROWSER inainte de trimitere. O poza de telefon
 *    are 4-8 MB; trei astfel de poze intr-un formular inseamna o trimitere care
 *    pica pe date mobile fara sa spuna de ce. Redimensionate la 1200px si
 *    trecute in JPEG, ajung la ~200 KB fiecare si raman mai mult decat
 *    suficiente pentru o poza tip buletin.
 */

type Copil = {
  cheie: number
  nume: string
  anNastere: string
  grupa: string
  telefon: string
  email: string
  pozitie: string
  poza: string | null
  pozaNume: string
}

const AN_CURENT = new Date().getFullYear()

/**
 * Posturile, cu denumirile folosite in rugby-ul romanesc si grupate cum se
 * grupeaza la juniori: pilierii de pe ambele parti sunt „Pilier", cei doi
 * flankeri sunt „Flanker", si tot asa. Un parinte stie ca baiatul lui joaca
 * centru; nu stie, si nici nu trebuie, daca e primul sau al doilea centru.
 *
 * Ultima varianta exista pentru ca la varstele mici copiii sunt mutati de la
 * un post la altul de la un meci la altul — iar un camp obligatoriu fara
 * raspuns potrivit se completeaza la intamplare, si atunci datele nu mai spun
 * nimic.
 */
const POSTURI = [
  'Pilier',
  'Taloner',
  'Linia a doua',
  'Flanker',
  'Number 8',
  'Mijlocaș la grămadă',
  'Mijlocaș la deschidere',
  'Centru',
  'Aripă',
  'Fundaș',
  'Nu știu / joacă mai multe',
] as const

let contorCheie = 1

function copilNou(): Copil {
  return {
    cheie: contorCheie++,
    nume: '',
    anNastere: '',
    grupa: '',
    telefon: '',
    email: '',
    pozitie: '',
    poza: null,
    pozaNume: '',
  }
}

/** Micsoreaza poza in browser si o da inapoi ca data URL JPEG. */
async function micsoreazaPoza(fisier: File, laturaMax = 1200): Promise<string> {
  const bitmap = await createImageBitmap(fisier)
  const scara = Math.min(1, laturaMax / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scara)
  const h = Math.round(bitmap.height * scara)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Nu pot procesa imaginea')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  return canvas.toDataURL('image/jpeg', 0.82)
}

export default function AcordFotoForm({ grupe }: { grupe: string[] }) {
  const [parinteNume, setParinteNume] = useState('')
  const [parinteTelefon, setParinteTelefon] = useState('')
  const [parinteEmail, setParinteEmail] = useState('')
  const [copii, setCopii] = useState<Copil[]>([copilNou()])
  const [consimtSite, setConsimtSite] = useState(false)
  const [consimtWA, setConsimtWA] = useState(false)
  const [refuz, setRefuz] = useState(false)
  const [website, setWebsite] = useState('') // capcana pentru roboti
  const [seTrimite, setSeTrimite] = useState(false)
  const [eroare, setEroare] = useState('')
  const [gata, setGata] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Ref, nu state: intre `touchstart` si primul `touchmove` React n-apuca sa
  // re-randeze, asa ca o valoare din state ar fi inca `false` cand vine prima
  // miscare — si linia n-ar incepe niciodata. Un ref se schimba pe loc.
  const deseneazaRef = useRef(false)
  const [aSemnat, setASemnat] = useState(false)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  useEffect(() => {
    initCanvas()
  }, [initCanvas])

  function pozitie(e: React.TouchEvent | React.MouseEvent) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const r = canvas.getBoundingClientRect()
    const sx = canvas.width / r.width
    const sy = canvas.height / r.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy }
    }
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy }
  }

  // Fara `preventDefault` in evenimentele de atingere: React le asculta
  // PASIV, deci apelul esueaza si umple consola cu erori. Derularea paginii in
  // timpul semnarii e oprita oricum de `touch-none` pe canvas — la nivel de
  // CSS, care nu depinde de felul in care asculta React.
  function incepe(e: React.TouchEvent | React.MouseEvent) {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    deseneazaRef.current = true
    setASemnat(true)
    const p = pozitie(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }

  function traseaza(e: React.TouchEvent | React.MouseEvent) {
    if (!deseneazaRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const p = pozitie(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }

  function opreste() {
    deseneazaRef.current = false
  }

  function stergeSemnatura() {
    setASemnat(false)
    initCanvas()
  }

  function actualizeaza(cheie: number, camp: keyof Copil, valoare: string | null) {
    setCopii((lista) =>
      lista.map((c) => (c.cheie === cheie ? { ...c, [camp]: valoare } : c))
    )
  }

  async function alegePoza(cheie: number, fisier: File | undefined) {
    if (!fisier) return
    if (!fisier.type.startsWith('image/')) {
      setEroare('Fișierul ales nu este o imagine.')
      return
    }
    try {
      const mica = await micsoreazaPoza(fisier)
      setCopii((lista) =>
        lista.map((c) => (c.cheie === cheie ? { ...c, poza: mica, pozaNume: fisier.name } : c))
      )
      setEroare('')
    } catch {
      setEroare('Poza nu a putut fi procesată. Încearcă altă imagine.')
    }
  }

  function bifeazaRefuz(valoare: boolean) {
    setRefuz(valoare)
    if (valoare) {
      setConsimtSite(false)
      setConsimtWA(false)
    }
  }

  function bifeazaAcord(setter: (v: boolean) => void, valoare: boolean) {
    setter(valoare)
    if (valoare) setRefuz(false)
  }

  async function trimite(e: React.FormEvent) {
    e.preventDefault()
    setEroare('')

    if (!aSemnat) {
      setEroare('Vă rugăm să semnați în casetă.')
      return
    }
    if (!consimtSite && !consimtWA && !refuz) {
      setEroare('Alegeți o variantă: fie unde permiteți publicarea, fie că nu sunteți de acord.')
      return
    }

    setSeTrimite(true)
    try {
      const raspuns = await fetch('/api/acord-foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parinteNume,
          parinteTelefon,
          parinteEmail,
          website,
          consimtSite,
          consimtWhatsApp: consimtWA,
          semnatura: canvasRef.current?.toDataURL('image/png'),
          copii: copii.map((c) => ({
            nume: c.nume,
            anNastere: c.anNastere,
            grupa: c.grupa,
            telefon: c.telefon,
            email: c.email,
            pozitie: c.pozitie,
            poza: c.poza,
          })),
        }),
      })
      const date = await raspuns.json().catch(() => ({}))
      if (!raspuns.ok) {
        setEroare(date.error || 'Trimiterea nu a reușit. Încercați din nou.')
        setSeTrimite(false)
        return
      }
      setGata(true)
    } catch {
      setEroare('Conexiune întreruptă. Verificați internetul și încercați din nou.')
      setSeTrimite(false)
    }
  }

  if (gata) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h2 className="font-heading text-2xl font-bold text-gray-900">Am primit acordul</h2>
        <p className="mx-auto mt-3 max-w-md text-gray-600">
          Vă mulțumim. Dacă vă răzgândiți, ne puteți scrie oricând la{' '}
          <a className="text-dinamo-red underline" href="mailto:contact@dinamorugby.ro">
            contact@dinamorugby.ro
          </a>{' '}
          și retragem acordul.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-dinamo-red px-8 py-3 font-heading font-bold text-white"
        >
          Înapoi la site
        </Link>
      </div>
    )
  }

  const camp =
    'w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-dinamo-red focus:ring-2 focus:ring-dinamo-red/30'
  const eticheta = 'mb-1 block text-sm font-semibold text-gray-700'

  return (
    <form onSubmit={trimite} className="mx-auto max-w-2xl px-4 py-10">
      {/* Datele părintelui */}
      <section className="mb-10">
        <h2 className="mb-4 font-heading text-xl font-bold text-dinamo-red">Datele dumneavoastră</h2>
        <div className="space-y-4">
          <div>
            <label className={eticheta} htmlFor="p-nume">Nume și prenume *</label>
            <input id="p-nume" className={camp} value={parinteNume} required minLength={3}
              autoComplete="name" onChange={(e) => setParinteNume(e.target.value)} />
          </div>
          <div>
            <label className={eticheta} htmlFor="p-tel">Telefon *</label>
            <input id="p-tel" className={camp} value={parinteTelefon} required type="tel"
              inputMode="tel" autoComplete="tel" placeholder="07xx xxx xxx"
              onChange={(e) => setParinteTelefon(e.target.value)} />
          </div>
          <div>
            <label className={eticheta} htmlFor="p-email">Email *</label>
            <input id="p-email" className={camp} value={parinteEmail} required type="email"
              inputMode="email" autoComplete="email"
              onChange={(e) => setParinteEmail(e.target.value)} />
          </div>
        </div>
      </section>

      {/* Copiii */}
      <section className="mb-10">
        <h2 className="mb-4 font-heading text-xl font-bold text-dinamo-red">
          {copii.length > 1 ? 'Copiii' : 'Copilul'}
        </h2>

        <div className="space-y-6">
          {copii.map((c, index) => (
            <div key={c.cheie} className="rounded-r-lg border-l-4 border-dinamo-red bg-gray-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading font-bold text-gray-900">
                  {copii.length > 1 ? `Copilul ${index + 1}` : 'Datele copilului'}
                </h3>
                {copii.length > 1 && (
                  <button type="button"
                    onClick={() => setCopii((l) => l.filter((x) => x.cheie !== c.cheie))}
                    className="text-sm font-semibold text-gray-500 underline hover:text-dinamo-red">
                    Șterge
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className={eticheta}>Nume și prenume *</label>
                  <input className={camp} value={c.nume} required minLength={3}
                    onChange={(e) => actualizeaza(c.cheie, 'nume', e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={eticheta}>An naștere *</label>
                    <input className={camp} value={c.anNastere} required type="number"
                      inputMode="numeric" min={2005} max={AN_CURENT} placeholder="2014"
                      onChange={(e) => actualizeaza(c.cheie, 'anNastere', e.target.value)} />
                  </div>
                  <div>
                    <label className={eticheta}>Grupa *</label>
                    {grupe.length > 0 ? (
                      <select className={camp} value={c.grupa} required
                        onChange={(e) => actualizeaza(c.cheie, 'grupa', e.target.value)}>
                        <option value="">Alege…</option>
                        {grupe.map((g) => <option key={g} value={g}>{g}</option>)}
                        <option value="Nu știu">Nu știu</option>
                      </select>
                    ) : (
                      <input className={camp} value={c.grupa} required placeholder="U12"
                        onChange={(e) => actualizeaza(c.cheie, 'grupa', e.target.value)} />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={eticheta}>Telefon copil</label>
                    <input className={camp} value={c.telefon} type="tel" inputMode="tel"
                      placeholder="dacă are"
                      onChange={(e) => actualizeaza(c.cheie, 'telefon', e.target.value)} />
                  </div>
                  <div>
                    <label className={eticheta}>Email copil</label>
                    <input className={camp} value={c.email} type="email" inputMode="email"
                      placeholder="dacă are"
                      onChange={(e) => actualizeaza(c.cheie, 'email', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className={eticheta}>Pe ce post joacă</label>
                  <select className={camp} value={c.pozitie}
                    onChange={(e) => actualizeaza(c.cheie, 'pozitie', e.target.value)}>
                    <option value="">Alege…</option>
                    {POSTURI.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className={eticheta}>Poză tip buletin</label>
                  <p className="mb-2 text-xs text-gray-500">
                    Copilul în picioare, cu spatele la un perete simplu, fotografiat din față, de la piept în sus.
                  </p>
                  {/* Doua butoane, nu unul.
                      `capture` deschide DIRECT camera si, pe multe telefoane,
                      scoate cu totul optiunea de a alege din galerie — deci un
                      singur camp cu `capture` ii ia parintelui posibilitatea de
                      a trimite o poza facuta ieri. Doua intrari separate spun pe
                      fata ce face fiecare. */}
                  <div className="flex flex-wrap gap-3">
                    <label className="cursor-pointer rounded-full bg-dinamo-red px-5 py-2.5 font-heading text-sm font-bold text-white transition hover:bg-dinamo-dark">
                      📷 Fă poză acum
                      <input type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={(e) => alegePoza(c.cheie, e.target.files?.[0])} />
                    </label>
                    <label className="cursor-pointer rounded-full border-2 border-gray-300 px-5 py-2.5 font-heading text-sm font-bold text-gray-700 transition hover:border-dinamo-red hover:text-dinamo-red">
                      🖼️ Alege din galerie
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => alegePoza(c.cheie, e.target.files?.[0])} />
                    </label>
                  </div>
                  {c.poza && (
                    <div className="mt-3 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.poza} alt={`Poza pentru ${c.nume || 'copil'}`}
                        className="h-24 w-20 rounded border border-gray-300 object-cover" />
                      <div>
                        <div className="text-sm font-semibold text-green-700">Poză adăugată ✓</div>
                        <button type="button"
                          onClick={() => { actualizeaza(c.cheie, 'poza', null); actualizeaza(c.cheie, 'pozaNume', '') }}
                          className="text-sm text-gray-500 underline hover:text-dinamo-red">
                          Schimbă poza
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={() => setCopii((l) => [...l, copilNou()])}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-4 font-heading font-bold text-gray-600 transition hover:border-dinamo-red hover:text-dinamo-red">
          <span className="text-xl leading-none">+</span> Mai am un copil
        </button>
      </section>

      {/* Acordul */}
      <section className="mb-10">
        <h2 className="mb-4 font-heading text-xl font-bold text-dinamo-red">Ce permiteți</h2>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:border-dinamo-red">
            <input type="checkbox" checked={consimtSite} className="mt-1 h-5 w-5 flex-shrink-0 accent-red-600"
              onChange={(e) => bifeazaAcord(setConsimtSite, e.target.checked)} />
            <span className="text-gray-700">
              Sunt de acord ca imaginea copilului meu să fie publicată pe <strong>dinamorugby.ro</strong> și
              pe pagina oficială de <strong>Facebook</strong> a echipei, pentru promovarea activității sportive.
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:border-dinamo-red">
            <input type="checkbox" checked={consimtWA} className="mt-1 h-5 w-5 flex-shrink-0 accent-red-600"
              onChange={(e) => bifeazaAcord(setConsimtWA, e.target.checked)} />
            <span className="text-gray-700">
              Sunt de acord ca imaginea copilului meu să fie distribuită în <strong>grupurile private
              de WhatsApp</strong> ale echipei.
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:border-gray-400">
            <input type="checkbox" checked={refuz} className="mt-1 h-5 w-5 flex-shrink-0 accent-gray-600"
              onChange={(e) => bifeazaRefuz(e.target.checked)} />
            <span className="text-gray-700">
              <strong>Nu sunt de acord</strong> cu publicarea imaginii copilului meu.
            </span>
          </label>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          Acordul este voluntar și îl puteți retrage oricând, scriind la contact@dinamorugby.ro, fără
          nicio urmare pentru copil. Datele sunt folosite numai în scopurile bifate mai sus. Detalii în{' '}
          <Link href="/politica-confidentialitate" className="underline">politica de confidențialitate</Link>.
        </p>
      </section>

      {/* Semnătura */}
      <section className="mb-8">
        <h2 className="mb-2 font-heading text-xl font-bold text-dinamo-red">Semnătura</h2>
        <p className="mb-3 text-sm text-gray-500">Semnați cu degetul, direct în casetă.</p>
        <canvas ref={canvasRef} width={600} height={200}
          className="w-full touch-none rounded-lg border-2 border-gray-300 bg-white"
          onMouseDown={incepe} onMouseMove={traseaza} onMouseUp={opreste}
          onMouseLeave={opreste}
          onTouchStart={incepe} onTouchMove={traseaza} onTouchEnd={opreste}
          onTouchCancel={opreste} />
        <button type="button" onClick={stergeSemnatura}
          className="mt-2 text-sm font-semibold text-gray-500 underline hover:text-dinamo-red">
          Șterge semnătura
        </button>
      </section>

      {/* Capcana pentru roboti — ascunsa de oameni, nu si de scripturi */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Nu completați acest câmp</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={website}
          onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {eroare && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-center text-red-700">{eroare}</p>
      )}

      <button type="submit" disabled={seTrimite}
        className="w-full rounded-full bg-dinamo-red py-4 font-heading text-lg font-bold text-white shadow-lg shadow-dinamo-red/25 transition hover:bg-dinamo-dark disabled:opacity-50">
        {seTrimite ? 'Se trimite…' : 'Trimite acordul'}
      </button>
    </form>
  )
}
