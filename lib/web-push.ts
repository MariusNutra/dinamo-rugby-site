import webPush from 'web-push'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || ''

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webPush.setVapidDetails(
    'mailto:contact@dinamorugby.ro',
    VAPID_PUBLIC,
    VAPID_PRIVATE
  )
}

interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

/**
 * Trimite catre toate abonamentele care se potrivesc filtrului.
 *
 * Cele patru functii de mai jos difereau doar prin filtru, dar fiecare isi
 * copia bucla de trimitere si curatarea abonamentelor moarte — trei locuri in
 * care trebuia tinuta minte aceeasi corectie.
 */
async function trimite(where: Prisma.PushSubscriptionWhereInput | undefined, payload: PushPayload): Promise<number> {
  const abonamente = await prisma.pushSubscription.findMany(where ? { where } : undefined)

  let trimise = 0
  for (const ab of abonamente) {
    try {
      await webPush.sendNotification(
        { endpoint: ab.endpoint, keys: { p256dh: ab.p256dh, auth: ab.auth } },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url || '/',
          icon: payload.icon || '/icons/icon-192.png',
        })
      )
      trimise++
    } catch (error: unknown) {
      // Abonament mort (dispozitiv sters, permisiune retrasa): il scoatem, ca
      // sa nu ramana o coada de destinatari care nu mai exista.
      const cod = (error as { statusCode?: number })?.statusCode
      if (cod === 410 || cod === 404) {
        await prisma.pushSubscription.delete({ where: { id: ab.id } }).catch(() => {})
      }
    }
  }
  return trimise
}

export async function sendPushToParent(parentId: string, payload: PushPayload) {
  return trimite({ parentId }, payload)
}

/** Notificare direct pe dispozitivul sportivului, nu al parintelui. */
export async function sendPushToAthlete(childId: string, payload: PushPayload) {
  return trimite({ childId }, payload)
}

export async function sendPushToAll(payload: PushPayload) {
  return trimite(undefined, payload)
}

/**
 * Toata echipa: si parintii copiilor din grupa, si sportivii care au acces
 * propriu. Inainte ajungea doar la parinti, deci un anunt de antrenament nu
 * ajungea niciodata pe telefonul copilului.
 */
export async function sendPushToTeam(teamId: number, payload: PushPayload) {
  const parinti = await prisma.parent.findMany({
    where: { children: { some: { teamId } } },
    select: { id: true },
  })

  return trimite(
    {
      OR: [
        { parentId: { in: parinti.map((p) => p.id) } },
        { child: { teamId, accessEnabled: true } },
      ],
    },
    payload
  )
}
