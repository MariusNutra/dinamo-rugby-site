'use client'
import { useEffect } from 'react'
export default function RegisterSW() {
  useEffect(() => {
    // If opened as installed PWA (standalone), redirect to the app
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (isStandalone) {
      window.location.href = 'https://app.dinamorugby.ro/'
      return
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
