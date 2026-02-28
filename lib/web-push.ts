import webPush from 'web-push'
import { prisma } from '@/lib/prisma'

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

export async function sendPushToParent(parentId: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { parentId },
  })

  let sent = 0
  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url || '/',
          icon: payload.icon || '/icons/icon-192.png',
        })
      )
      sent++
    } catch (error: unknown) {
      // Remove invalid subscriptions (410 Gone or 404)
      const statusCode = (error as { statusCode?: number })?.statusCode
      if (statusCode === 410 || statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
      }
    }
  }
  return sent
}

export async function sendPushToAll(payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany()
  let sent = 0

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url || '/',
          icon: payload.icon || '/icons/icon-192.png',
        })
      )
      sent++
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number })?.statusCode
      if (statusCode === 410 || statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
      }
    }
  }
  return sent
}

export async function sendPushToTeam(teamId: number, payload: PushPayload) {
  const parents = await prisma.parent.findMany({
    where: { children: { some: { teamId } } },
    select: { id: true },
  })

  const parentIds = parents.map(p => p.id)
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { parentId: { in: parentIds } },
  })

  let sent = 0
  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url || '/',
          icon: payload.icon || '/icons/icon-192.png',
        })
      )
      sent++
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number })?.statusCode
      if (statusCode === 410 || statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
      }
    }
  }
  return sent
}
