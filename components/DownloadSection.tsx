'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

export default function DownloadSection() {
  const [isMobile, setIsMobile] = useState(false)
  const [, setIsWindows] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIosInstructions, setShowIosInstructions] = useState(false)
  const [pwaSupported, setPwaSupported] = useState(false)
  const deferredPrompt = useRef<Event | null>(null)

  useEffect(() => {
    const ua = navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const android = /Android/.test(ua)
    const mobile = ios || android || /Mobile/.test(ua)
    const windows = /Windows/.test(ua)

    setIsMobile(mobile)
    setIsWindows(windows)
    setIsIOS(ios)

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e
      setPwaSupported(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function handlePwaInstall() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prompt = deferredPrompt.current as any
    if (!prompt) return
    prompt.prompt()
    prompt.userChoice.then(() => {
      deferredPrompt.current = null
      setPwaSupported(false)
    })
  }

  return (
    <section className="bg-gradient-to-br from-dinamo-red via-red-700 to-dinamo-dark py-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4">
            <Image
              src="/images/dinamo-rugby-bulldog.png"
              alt="Dinamo Rugby"
              width={80}
              height={80}
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <h2 className="font-heading font-bold text-3xl text-white mb-2">
            Descarcă Aplicația Dinamo Rugby
          </h2>
          <p className="text-white/80 text-lg">
            Rămâi conectat cu echipa — program, prezențe, rezultate și multe altele
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Mobile install */}
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="w-12 h-12 mx-auto mb-3 bg-red-50 rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="7" y="2" width="10" height="20" rx="2" stroke="#D50032" strokeWidth="2"/>
                <circle cx="12" cy="18" r="1" fill="#D50032"/>
              </svg>
            </div>
            <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">
              Aplicație Mobilă
            </h3>
            <p className="text-sm text-gray-500 mb-4">Android &amp; iOS</p>

            {isIOS ? (
              <>
                <button
                  onClick={() => setShowIosInstructions(!showIosInstructions)}
                  className="w-full bg-dinamo-red text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Instalează pe iOS
                </button>
                {showIosInstructions && (
                  <div className="mt-3 text-left bg-red-50 rounded-lg p-3 text-sm text-gray-700">
                    <p className="font-semibold mb-1">Din Safari:</p>
                    <p>1. Apasă <strong>Share</strong> (📤)</p>
                    <p>2. <strong>Adaugă pe ecranul principal</strong></p>
                    <p>3. Confirmă cu <strong>Adaugă</strong></p>
                  </div>
                )}
              </>
            ) : isMobile && pwaSupported ? (
              <button
                onClick={handlePwaInstall}
                className="w-full bg-dinamo-red text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors"
              >
                Instalează pe Android
              </button>
            ) : (
              <a
                href="https://app.dinamorugby.ro"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-dinamo-red text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors text-center"
              >
                Deschide Aplicația
              </a>
            )}
          </div>

          {/* Windows PWA install */}
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="w-12 h-12 mx-auto mb-3 bg-red-50 rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="12" rx="2" stroke="#D50032" strokeWidth="2"/>
                <line x1="8" y1="20" x2="16" y2="20" stroke="#D50032" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="16" x2="12" y2="20" stroke="#D50032" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">
              Instalează pe Windows
            </h3>
            <p className="text-sm text-gray-500 mb-4">Aplicație din browser</p>

            {!isMobile && pwaSupported ? (
              <button
                onClick={handlePwaInstall}
                className="w-full bg-dinamo-red text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors"
              >
                Instalează Acum
              </button>
            ) : (
              <a
                href="https://app.dinamorugby.ro"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-dinamo-red text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors text-center"
              >
                Deschide în Browser
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
