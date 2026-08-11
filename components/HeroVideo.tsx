'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Intro-ul din hero: videoul ruleaza O SINGURA DATA si se opreste pe stema.
 *
 * Nu exista bucla si nu exista o sigla suprapusa peste video: stema ESTE
 * ultimul cadru al filmului. Cand se termina, imaginea ramane acolo de la sine.
 * Din acelasi motiv, posterul e tot ultimul cadru — asa, in orice stare in care
 * videoul nu ruleaza (inca se incarca, a fost blocat, sau omul a cerut mai
 * putina miscare), ce se vede tot stema e.
 *
 * ## Sunetul — ce se poate si ce nu
 *
 * Niciun browser nu garanteaza pornirea cu sunet. Chrome, Safari si Firefox
 * blocheaza asta din 2018, si nu e o setare de ocolit: daca ceri `play()` cu
 * sunet si browserul refuza, promisiunea e RESPINSA si videoul nu porneste
 * DELOC. Deci incercam in ordine, nu presupunem:
 *
 *   1. cu sunet — reuseste la cine a mai interactionat cu situl (Chrome tine un
 *      scor de „media engagement" per domeniu) sau a dat permisiunea
 *   2. daca a fost refuzat, MUT — ca sa se vada oricum filmul
 *
 * Cand am cazut pe varianta muta, butonul „Reia cu sunet" e singura cale catre
 * replica de la inceput: apasarea lui E gestul pe care il cere browserul.
 */
export default function HeroVideo({ children }: { children?: React.ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [terminat, setTerminat] = useState(false)
  const [sAAuzit, setSAAuzit] = useState(false)
  const [miscareRedusa, setMiscareRedusa] = useState(false)
  const [prinsDeTimp, setPrinsDeTimp] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      // Cine cere mai putina miscare are de obicei un motiv medical. Nu pornim
      // nimic — posterul e stema, deci pagina arata intreaga oricum.
      setMiscareRedusa(true)
      return
    }

    // Plasa de siguranta: textul de sub video NU are voie sa depinda de un
    // eveniment care poate sa nu vina niciodata. Daca `onEnded` nu se
    // declanseaza — fisier care nu se incarca, redare blocata, tab in fundal —
    // continutul apare oricum. Titlul unei pagini nu se tine intr-o promisiune.
    const ceas = setTimeout(() => setPrinsDeTimp(true), 12_000)

    const v = videoRef.current
    if (!v) { clearTimeout(ceas); return }

    v.muted = false
    v.play()
      .then(() => setSAAuzit(true))
      .catch(() => {
        v.muted = true
        v.play().catch(() => setTerminat(true))
      })

    // A doua sansa la sunet, fara sa i se ceara omului nimic.
    //
    // Daca pornirea cu sunet a fost refuzata, filmul merge mut — dar PRIMA
    // atingere a paginii, orice ar fi ea, e gestul pe care browserul il astepta.
    // Din clipa aia avem voie sa dam drumul la sunet, si o facem pe loc, cat
    // filmul inca ruleaza. Butonul ramane pentru cine nu atinge nimic.
    //
    // Doar `pointerdown`, `keydown` si `touchstart` conteaza ca gest. Miscarea
    // mouse-ului si derularea NU activeaza nimic — de aceea nu le ascultam:
    // ar da impresia ca merge si ar esua tacut.
    function laPrimaAtingere() {
      const vid = videoRef.current
      if (vid && !vid.ended && vid.muted) {
        vid.muted = false
        setSAAuzit(true)
      }
      desprinde()
    }
    const evenimente = ['pointerdown', 'keydown', 'touchstart'] as const
    function desprinde() {
      for (const e of evenimente) document.removeEventListener(e, laPrimaAtingere)
    }
    for (const e of evenimente) {
      document.addEventListener(e, laPrimaAtingere, { once: true, passive: true })
    }

    return () => {
      clearTimeout(ceas)
      desprinde()
    }
  }, [])

  function reiaCuSunet() {
    const v = videoRef.current
    if (!v) return
    setTerminat(false)
    v.currentTime = 0
    v.muted = false
    v.play().then(() => setSAAuzit(true)).catch(() => setTerminat(true))
  }

  // Butonul apare doar daca replica NU s-a auzit. Un buton de sunet oferit
  // cuiva care tocmai a auzit sunetul e zgomot pe ecran.
  const arataButonul = (terminat || miscareRedusa) && !sAAuzit

  /** Textul apare dupa ce stema s-a asezat — sau oricum, daca ceva n-a mers. */
  const arataTextul = terminat || miscareRedusa || prinsDeTimp

  return (
    <>
      {/* `object-contain`, NU `cover`: cover umplea dreptunghiul taind din
          cadru, iar ce se pierdea era exact marginea stemei. Contain arata
          filmul intreg; unde raportul ecranului nu se potriveste cu 16:9 ramane
          la vedere gradientul rosu al clubului, deci golul citeste ca rama, nu
          ca greseala. */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        src="/video/dinamo-hero.mp4"
        poster="/video/dinamo-hero-poster.jpg"
        playsInline
        preload="auto"
        onEnded={() => setTerminat(true)}
        aria-hidden="true"
      />

      {/* Voalul are DOUA stari, si asta rezolva singurul conflict real al
          machetei: stema e dimensionata de latimea ecranului, deci pe un monitor
          mare ajunge exact acolo unde trebuie sa stea textul. Nu se poate „muta"
          — object-position n-are ce decupa cand cutia e aproape de 16:9.
          Cat ruleaza filmul, voalul e subtire: se vede stema, nu se acopera nimic.
          Cand s-a terminat, se ingroasa — stema devine fundal, iar titlul are pe
          ce sta. Filmul si-a spus replica deja; de aici incolo conteaza mesajul. */}
      <div
        className={`absolute inset-0 transition-colors duration-1000 ${
          arataTextul ? 'bg-black/60' : 'bg-gradient-to-t from-black/60 to-transparent'
        }`}
      />

      <div className="relative z-10 w-full px-4 py-20 text-center">
        {children && (
          <div
            className={`transition-opacity duration-1000 ${arataTextul ? 'opacity-100' : 'opacity-0'}`}
          >
            {children}
          </div>
        )}

        {arataButonul && (
          <button
            type="button"
            onClick={reiaCuSunet}
            className="mx-auto mt-5 flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span aria-hidden="true">🔊</span> Reia cu sunet
          </button>
        )}
      </div>
    </>
  )
}
