'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const COOKIE_NAME = 'dinamo_cookie_consent'
const EXPIRE_DAYS = 365

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, days: number) {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`
}

function removeNonEssentialCookies() {
  const nonEssential = ['_ga', '_gid', '_gat', '_fbp', 'fr', 'IDE', 'NID', 'test_cookie']
  const hostname = window.location.hostname

  nonEssential.forEach((name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${hostname};`
  })

  // Remove _ga_* cookies
  document.cookie.split(';').forEach((cookie) => {
    const cookieName = cookie.split('=')[0].trim()
    if (cookieName.startsWith('_ga_')) {
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${hostname};`
    }
  })
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    const consent = getCookie(COOKIE_NAME)
    if (!consent) {
      setVisible(true)
    }
  }, [])

  function hideBanner() {
    setHiding(true)
    setTimeout(() => {
      setVisible(false)
      setHiding(false)
    }, 300)
  }

  function handleAcceptAll() {
    setCookie(COOKIE_NAME, 'all', EXPIRE_DAYS)
    hideBanner()
  }

  function handleAcceptNecessary() {
    setCookie(COOKIE_NAME, 'necessary', EXPIRE_DAYS)
    removeNonEssentialCookies()
    hideBanner()
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Consimțământ cookie-uri"
      className={`fixed bottom-0 left-0 right-0 z-[999999] bg-[#1a1a2e] text-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] font-body text-sm ${
        hiding ? 'animate-slide-down' : 'animate-slide-up'
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 py-5 flex flex-col md:flex-row items-center gap-5">
        <div className="flex-1">
          <p className="text-gray-300 mb-2">
            Folosim cookie-uri pentru a-ți oferi cea mai bună experiență pe
            site-ul nostru. Cookie-urile ne ajută să analizăm traficul și să
            personalizăm conținutul. Poți alege să accepți toate cookie-urile sau
            doar pe cele strict necesare pentru funcționarea site-ului.
          </p>
          <p className="text-gray-400">
            Citește{' '}
            <Link
              href="/politica-cookies-gdpr"
              className="text-red-400 underline font-semibold hover:text-red-300"
            >
              Politica de Cookies &amp; GDPR
            </Link>{' '}
            pentru detalii complete.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            onClick={handleAcceptAll}
            className="px-7 py-3 bg-dinamo-red text-white font-bold rounded-md hover:bg-dinamo-dark transition-all hover:-translate-y-0.5 hover:shadow-lg whitespace-nowrap cursor-pointer"
          >
            Acceptă toate
          </button>
          <button
            onClick={handleAcceptNecessary}
            className="px-7 py-3 bg-transparent text-gray-300 font-bold rounded-md border-2 border-gray-600 hover:border-gray-400 hover:text-white transition-all whitespace-nowrap cursor-pointer"
          >
            Doar necesare
          </button>
        </div>
      </div>
    </div>
  )
}
