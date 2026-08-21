import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { resolveParentId } from '@/lib/parent-identity'

// GET - Get unread conversation count
export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  const parentId = await resolveParentId(req)

  if (!user && !parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const where: Record<string, unknown> = {}
    if (parentId) {
      where.parentId = parentId
    } else if (user) {
      where.userId = user.userId
    }

    const participations = await prisma.conversationParticipant.findMany({
      where,
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { createdAt: true },
            },
          },
        },
      },
    })

    let unreadCount = 0
    for (const p of participations) {
      const lastMsg = p.conversation.messages[0]
      if (lastMsg) {
        if (!p.lastReadAt || new Date(lastMsg.createdAt) > new Date(p.lastReadAt)) {
          unreadCount++
        }
      }
    }

    return NextResponse.json({ unread: unreadCount })
  } catch (error) {
    console.error('Failed to get unread count:', error)
    return NextResponse.json({ error: 'Eroare' }, { status: 500 })
  }
}
