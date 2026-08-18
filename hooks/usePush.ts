'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * Abonarea dispozitivului la notificari.
 *
 * Logica statea in tabloul parintilor. De cand se aboneaza si sportivii, ar fi
 * ajuns in doua locuri — iar partea delicata (cheia VAPID convertita, dezabonarea
 * atat pe server cat si in browser) e exact genul de cod care se desincronizeaza
 * cand e copiat. Rutele decid singure al cui e abonamentul, dupa sesiune.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function base64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}

export interface StarePush {
  suportat: boolean
  abonat: boolean
  seLucreaza: boolean
  comuta: () => Promise<void>
}

export function usePush(): StarePush {
  const [suportat, setSuportat] = useState(false)
  const [abonat, setAbonat] = useState(false)
  const [seLucreaza, setSeLucreaza] = useState(true)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC_KEY) {
      setSeLucreaza(false)
      return
    }
    setSuportat(true)
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setAbonat(Boolean(sub))
        setSeLucreaza(false)
      })
      .catch(() => setSeLucreaza(false))
  }, [])

  const comuta = useCallback(async () => {
    setSeLucreaza(true)
    try {
      const reg = await navigator.serviceWorker.ready

      if (abonat) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          // Intai serverul, apoi browserul: daca stergem local si cererea pica,
          // ramane un abonament orfan caruia i se tot trimite.
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
        }
        setAbonat(false)
      } else {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(VAPID_PUBLIC_KEY),
        })
        const json = sub.toJSON()
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        })
        setAbonat(true)
      }
    } catch {
      // Permisiune refuzata sau browser care nu poate: starea ramane cum era.
    }
    setSeLucreaza(false)
  }, [abonat])

  return { suportat, abonat, seLucreaza, comuta }
}
