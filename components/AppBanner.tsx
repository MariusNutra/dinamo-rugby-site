'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

const DISMISS_KEY = 'dinamo_app_banner_dismissed'
const DISMISS_DAYS = 7

export default function AppBanner() {
  const [visible, setVisible] = useState(false)
  const [hiding, setHiding] = useState(false)
  const bandaRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Don't show if already in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true

    if (isStandalone) return

    // Don't show on desktop
    if (window.innerWidth > 768) return

    // Check dismiss timestamp
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10)
      if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return
    }

    setVisible(true)
  }, [])

  // Banda sta fixata jos, peste pagina. Fara spatiul asta, ultimele randuri
  // raman ascunse sub ea chiar si derulat pana la capat — pe telefon, „Administrare"
  // si ultimul rand din subsol nu se puteau atinge. Inaltimea se masoara, nu se
  // ghiceste: textul poate trece pe doua randuri la ecrane inguste.
  useEffect(() => {
    const banda = bandaRef.current
    if (!visible || hiding || !banda) {
      document.body.style.paddingBottom = ''
      return
    }

    const sincronizeaza = () => {
      document.body.style.paddingBottom = `${banda.offsetHeight}px`
    }
    sincronizeaza()

    const observer = new ResizeObserver(sincronizeaza)
    observer.observe(banda)
    return () => {
      observer.disconnect()
      document.body.style.paddingBottom = ''
    }
  }, [visible, hiding])

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setHiding(true)
    setTimeout(() => {
      setVisible(false)
      setHiding(false)
    }, 300)
  }

  if (!visible) return null

  return (
    <div
      ref={bandaRef}
      className={`fixed bottom-0 left-0 right-0 z-[99999] bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.15)] pb-[env(safe-area-inset-bottom)] md:hidden ${
        hiding ? 'animate-slide-down' : 'animate-slide-up'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
          aria-label="Inchide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <Image
          src="/images/dinamo-rugby-bulldog.png"
          alt="Dinamo Rugby"
          width={40}
          height={40}
          className="w-10 h-10 flex-shrink-0 rounded-lg"
        />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">Dinamo Rugby</p>
          <p className="text-xs text-gray-500 leading-tight">Aplicatia clubului</p>
        </div>

        {/* Install button */}
        <a
          href="https://app.dinamorugby.ro"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 px-4 py-2 bg-dinamo-red text-white text-sm font-bold rounded-lg hover:bg-dinamo-dark transition-colors"
        >
          Instaleaza
        </a>
      </div>
    </div>
  )
}
