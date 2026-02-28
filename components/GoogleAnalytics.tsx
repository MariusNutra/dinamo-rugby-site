'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export default function GoogleAnalytics() {
  const [consent, setConsent] = useState<string | null>(null)

  useEffect(() => {
    setConsent(getCookie('dinamo_cookie_consent'))
    // Listen for consent changes
    const observer = new MutationObserver(() => {
      setConsent(getCookie('dinamo_cookie_consent'))
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  // Only load GA if we have a measurement ID and user consented to all cookies
  if (!GA_ID || consent !== 'all') return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_title: document.title,
            send_page_view: true
          });
        `}
      </Script>
    </>
  )
}
