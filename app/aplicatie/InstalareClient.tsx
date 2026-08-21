'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Instalarea, potrivita telefonului din mana.
 *
 * Android: Chrome ofera un prompt de instalare, deci parintele apasa o data si
 * scurtatura apare pe ecran. Promptul cere obligatoriu o apasare — nu se poate
 * declansa singur, browserul il refuza.
 *
 * iPhone: Safari NU ofera niciun prompt. Adaugarea e manuala, din meniul de
 * partajare, deci pasii se arata direct — nu ascunsi in spatele unui buton care
 * n-ar avea ce face.
 */

type Platforma = 'ios' | 'android' | 'desktop'

interface Pas {
  titlu: string
  text: string
}

/**
 * Pasii merg in ORICE browser de pe iPhone. Din iOS 16.4, si Chrome, Edge sau
 * Firefox pot adauga pe ecranul principal — nu mai e nevoie sa-l trimiti pe om
 * in Safari. Difera doar unde sta butonul de partajare, si asta scrie in pas.
 */
function pasiIPhone(butonSus: boolean): Pas[] {
  return [
    {
      titlu: 'Apasă butonul de partajare',
      text: butonSus
        ? 'E pătratul cu săgeata în sus, în dreapta sus. Îl găsești și în meniul ⋮.'
        : 'E pătratul cu săgeata în sus, în bara de jos. Dacă nu-l vezi, trage puțin pagina în jos — bara se ascunde când derulezi.',
    },
    {
      titlu: 'Alege „Adaugă la ecranul principal"',
      text: 'E în lista care se deschide, mai jos de rândul cu iconițe. Pe telefoanele setate în engleză se numește „Add to Home Screen".',
    },
    {
      titlu: 'Confirmă cu „Adaugă"',
      text: 'Iconița Dinamo apare pe ecran, lângă celelalte aplicații. De acum o deschizi de acolo, fără browser.',
    },
    {
      titlu: 'Intră o dată cu emailul și parola',
      text: 'Aplicația de pe ecran pornește separat de browser și îți cere din nou datele. Se întâmplă o singură dată.',
    },
  ]
}

const PASI_ANDROID: Pas[] = [
  {
    titlu: 'Deschide meniul ⋮',
    text: 'Din dreapta sus, în Chrome.',
  },
  {
    titlu: 'Alege „Instalează aplicația"',
    text: 'Sau „Adaugă la ecranul principal", în funcție de versiunea de Chrome.',
  },
  {
    titlu: 'Confirmă',
    text: 'Iconița Dinamo apare pe ecran și se deschide ca orice aplicație.',
  },
]

function Pasi({ pasi }: { pasi: Pas[] }) {
  return (
    <ol className="space-y-4">
      {pasi.map((pas, i) => (
        <li key={pas.titlu} className="flex gap-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-dinamo-red text-white font-bold flex items-center justify-center">
            {i + 1}
          </span>
          <div>
            <p className="font-semibold text-gray-900">{pas.titlu}</p>
            <p className="text-gray-600 mt-0.5">{pas.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

/**
 * Sageata catre butonul de partajare din Safari.
 *
 * Butonul e in bara browserului, nu in pagina, deci nu putem arata exact spre
 * el — aratam in jos, spre mijlocul barii, unde sta pe majoritatea iPhone-urilor.
 * Cine si-a mutat bara sus gaseste mentiunea in primul pas.
 */
function SageataPartajare() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] pointer-events-none"
      aria-hidden="true"
    >
      <div className="mx-auto mb-3 w-fit rounded-full bg-dinamo-red px-4 py-2 text-center text-sm font-semibold text-white shadow-lg">
        Butonul de partajare, în bara Safari
        <span className="mx-auto mt-1 block h-0 w-0 animate-bob border-x-[10px] border-x-transparent border-t-[12px] border-t-white motion-reduce:animate-none" />
      </div>
    </div>
  )
}

function Sectiune({ titlu, subtitlu, children }: {
  titlu: string
  subtitlu?: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-10">
      <h2 className="font-heading font-bold text-2xl mb-1 text-dinamo-red">
        {titlu}
      </h2>
      {subtitlu && <p className="text-gray-500 mb-6">{subtitlu}</p>}
      {children}
    </section>
  )
}

export function InstalareClient() {
  // `null` cat timp nu stim pe ce suntem: se arata ambele seturi de pasi, ca
  // pagina sa fie utila si fara JavaScript, si sa nu clipeasca gol.
  const [platforma, setPlatforma] = useState<Platforma | null>(null)
  // In Safari butonul de partajare e in bara de jos; in Chrome/Edge/Firefox de
  // pe iPhone e in dreapta sus. Atat schimba browserul — pasii sunt aceiasi.
  const [butonSus, setButonSus] = useState(false)
  const [instalabil, setInstalabil] = useState(false)
  const [instalat, setInstalat] = useState(false)
  const promptAmanat = useRef<{ prompt: () => void; userChoice: Promise<unknown> } | null>(null)

  useEffect(() => {
    const ua = navigator.userAgent
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const android = /Android/.test(ua)
    // Pe iPhone, Chrome si Firefox folosesc tot motorul Safari, dar NU pot
    // adauga pe ecranul principal. Cine e in ele trebuie trimis in Safari.
    const safari = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)

    // Telefonul se recunoaste dupa numele browserului, dar si dupa felul in
    // care e atins: un telefon pus pe „site pentru desktop" trimite alt nume,
    // insa degetul ramane deget. `pointer: coarse` il da de gol.
    const atingere = window.matchMedia('(pointer: coarse)').matches

    if (ios) {
      setPlatforma('ios')
      setButonSus(!safari)
    } else if (android || (atingere && window.innerWidth < 900)) {
      setPlatforma('android')
    } else {
      setPlatforma('desktop')
    }

    setInstalat(
      window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true
    )

    const handler = (e: Event) => {
      e.preventDefault()
      promptAmanat.current = e as unknown as typeof promptAmanat.current
      setInstalabil(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalat(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function instaleaza() {
    const prompt = promptAmanat.current
    if (!prompt) return
    prompt.prompt()
    prompt.userChoice.then(() => {
      promptAmanat.current = null
      setInstalabil(false)
    })
  }

  if (instalat) {
    return (
      <p className="rounded-xl bg-green-50 border border-green-200 p-4 text-green-800">
        Aplicația e deja pe acest telefon. O deschizi de pe ecranul principal, ca
        pe oricare alta.
      </p>
    )
  }

  const buton = (text: string) => (
    <button
      onClick={instaleaza}
      className="w-full sm:w-auto bg-dinamo-red text-white font-bold py-4 px-8 rounded-lg hover:bg-dinamo-dark transition-colors text-lg"
    >
      {text}
    </button>
  )

  const deschide = (
    <a
      href="https://app.dinamorugby.ro"
      className="inline-block w-full sm:w-auto text-center bg-dinamo-red text-white font-bold py-4 px-8 rounded-lg hover:bg-dinamo-dark transition-colors text-lg"
    >
      Deschide aplicația
    </a>
  )

  if (platforma === 'android') {
    return (
      <>
        <Sectiune
          titlu="Pune-o pe ecran"
          subtitlu="O apăsare — scurtătura apare lângă celelalte aplicații."
        >
          {instalabil ? (
            buton('Adaugă pe ecran')
          ) : (
            <>
              <p className="mb-6 text-gray-600">
                Chrome nu ne lasă să o adăugăm de aici de data asta — fie e deja
                adăugată, fie folosești alt browser. O pui manual, în trei pași:
              </p>
              <Pasi pasi={PASI_ANDROID} />
              <div className="mt-6">{deschide}</div>
            </>
          )}
        </Sectiune>
      </>
    )
  }

  if (platforma === 'ios') {
    return (
      <>
        <Sectiune
          titlu="Pune-o pe ecran"
          subtitlu="Pe iPhone se adaugă din browser, oricare ar fi el. Durează mai puțin de un minut."
        >
          <Pasi pasi={pasiIPhone(butonSus)} />
        </Sectiune>
        {!butonSus && <SageataPartajare />}
      </>
    )
  }

  if (platforma === 'desktop') {
    return (
      <Sectiune
        titlu="Deschide-o pe telefon"
        subtitlu="Aplicația e făcută pentru telefon. Intră de acolo pe app.dinamorugby.ro și pașii apar singuri."
      >
        {instalabil ? buton('Instalează pe acest calculator') : deschide}
      </Sectiune>
    )
  }

  // Inca nu stim telefonul (sau nu ruleaza JavaScript): aratam ambele seturi.
  return (
    <>
      <Sectiune titlu="Pe iPhone" subtitlu="Din browserul pe care îl folosești.">
        <Pasi pasi={pasiIPhone(false)} />
      </Sectiune>
      <Sectiune titlu="Pe Android" subtitlu="Din Chrome.">
        <Pasi pasi={PASI_ANDROID} />
      </Sectiune>
    </>
  )
}
