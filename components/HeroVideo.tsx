'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Hero-ul cinematic: filmul ruleaza O SINGURA DATA si se opreste pe stema.
 *
 * Nu exista bucla si nu exista o sigla suprapusa: stema E ultimul cadru al
 * filmului, deci ramane acolo de la sine. Din acelasi motiv posterul e tot
 * ultimul cadru — in orice stare in care videoul nu ruleaza (se incarca, a fost
 * blocat, sau omul a cerut mai putina miscare), ce se vede tot stema e.
 *
 * ## De ce cap-coada, pe negru
 *
 * Filmul are fundal propriu de carbon aproape negru. Cat timp a stat pe
 * gradientul rosu al sitului, se vedea o muchie: un dreptunghi intunecat lipit
 * peste rosu. Pe fundal negru muchia dispare, si atunci filmul nu mai pare
 * incarcat in pagina — pare pagina. Rosul ramane accent (butonul), nu fundal.
 *
 * ## Sunetul — ce se poate si ce nu
 *
 * Niciun browser nu porneste un video cu sunet inainte ca omul sa fi atins
 * pagina. Regula e din 2018 si nu se ocoleste: daca ceri `play()` cu sunet si
 * esti refuzat, promisiunea e RESPINSA si filmul nu porneste deloc. Deci
 * incercam in trepte, si niciuna nu presupune ca precedenta a mers:
 *
 *   1. cu sunet — reuseste la cine a mai interactionat cu situl
 *   2. daca a fost refuzat, mut — ca sa se vada oricum filmul
 *   3. la PRIMA atingere a paginii, sunetul se aprinde singur, cat filmul ruleaza
 *   4. butonul „Cu sunet", pentru cine n-a atins nimic
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

    // Plasa de siguranta: textul NU are voie sa depinda de un eveniment care
    // poate sa nu vina niciodata. Daca `onEnded` nu se declanseaza — fisier care
    // nu se incarca, redare blocata, tab in fundal — continutul apare oricum.
    const ceas = setTimeout(() => setPrinsDeTimp(true), 12_000)

    // Doar `pointerdown`, `keydown` si `touchstart` conteaza ca gest de
    // activare. Miscarea mouse-ului si derularea NU activeaza nimic in Chrome —
    // de aceea nu le ascultam: ar da impresia ca merge si ar esua tacut.
    const evenimente = ['pointerdown', 'keydown', 'touchstart'] as const
    function desprinde() {
      for (const e of evenimente) document.removeEventListener(e, laPrimaAtingere)
    }
    function laPrimaAtingere() {
      const vid = videoRef.current
      if (vid && !vid.ended && vid.muted) {
        vid.muted = false
        setSAAuzit(true)
      }
      desprinde()
    }
    for (const e of evenimente) {
      document.addEventListener(e, laPrimaAtingere, { once: true, passive: true })
    }

    const v = videoRef.current
    if (v) {
      v.muted = false
      v.play()
        .then(() => setSAAuzit(true))
        .catch(() => {
          v.muted = true
          v.play().catch(() => setTerminat(true))
        })
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

  const arataTextul = terminat || miscareRedusa || prinsDeTimp
  // Butonul apare doar daca replica NU s-a auzit. Un buton de sunet oferit
  // cuiva care tocmai a auzit sunetul e zgomot pe ecran.
  const arataButonul = (terminat || miscareRedusa) && !sAAuzit

  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/video/dinamo-hero.mp4"
        poster="/video/dinamo-hero-poster.jpg"
        playsInline
        preload="auto"
        onEnded={() => setTerminat(true)}
        aria-hidden="true"
      />

      {/* Vinietare: intuneca marginile si colturile, lasand centrul curat. Face
          doua lucruri deodata — duce ochiul spre stema si da textului de jos un
          fond pe care sa se citeasca, fara sa puna o bara peste imagine. */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(0,0,0,0.8) 100%)' }}
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/75 to-transparent" />

      {/* Continutul sta jos-stanga, nu centrat: compozitia simetrica e cea
          implicita a oricarui sablon, asimetria citeste ca decizie. */}
      <div className="relative z-10 w-full max-w-3xl px-6 pb-14 text-left md:px-14 md:pb-20">
        {children && (
          <div
            className={`transition-all duration-1000 ${
              arataTextul ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {children}
          </div>
        )}
      </div>

      {arataButonul && (
        <button
          type="button"
          onClick={reiaCuSunet}
          aria-label="Reia filmul cu sunet"
          className="absolute bottom-6 right-6 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm transition hover:bg-black/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span aria-hidden="true">🔊</span> Cu sunet
        </button>
      )}
    </>
  )
}
