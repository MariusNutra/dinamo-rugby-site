import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getParentId } from '@/lib/parent-auth'

// GET - List conversations for admin or parent
export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  const parentId = await getParentId()

  if (!user && !parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const where: Record<string, unknown> = {}

    if (parentId) {
      where.participants = { some: { parentId } }
    } else if (user) {
      // Admin sees all conversations or ones they're part of
      const showAll = req.nextUrl.searchParams.get('all') === '1'
      if (!showAll) {
        where.participants = { some: { userId: user.userId } }
      }
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        participants: {
          include: {
            parent: { select: { id: true, name: true, email: true } },
            user: { select: { id: true, name: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, senderParentId: true, senderUserId: true },
        },
        team: { select: { id: true, grupa: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const formatted = conversations.map(conv => {
      const lastMessage = conv.messages[0]
      const myParticipant = parentId
        ? conv.participants.find(p => p.parentId === parentId)
        : conv.participants.find(p => p.userId === user?.userId)

      const unread = myParticipant?.lastReadAt
        ? lastMessage && new Date(lastMessage.createdAt) > new Date(myParticipant.lastReadAt)
        : !!lastMessage

      return {
        id: conv.id,
        type: conv.type,
        subject: conv.subject,
        teamName: conv.team?.grupa || null,
        participants: conv.participants.map(p => ({
          name: p.parent?.name || p.user?.name || 'Necunoscut',
          type: p.parentId ? 'parent' : 'admin',
        })),
        lastMessage: lastMessage ? {
          content: lastMessage.content.slice(0, 100),
          createdAt: lastMessage.createdAt.toISOString(),
        } : null,
        unread,
        updatedAt: conv.updatedAt.toISOString(),
      }
    })

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Failed to list conversations:', error)
    return NextResponse.json({ error: 'Eroare' }, { status: 500 })
  }
}

// POST - Create new conversation
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  const parentId = await getParentId()

  if (!user && !parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const { subject, participantParentIds, participantUserIds, type, teamId, message } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Mesajul este obligatoriu' }, { status: 400 })
    }

    const participants: { parentId?: string; userId?: number }[] = []

    // Add the creator as participant
    if (parentId) {
      participants.push({ parentId })
    } else if (user) {
      participants.push({ userId: user.userId })
    }

    // Add other participants
    if (participantParentIds) {
      for (const pid of participantParentIds) {
        if (pid !== parentId) participants.push({ parentId: pid })
      }
    }
    if (participantUserIds) {
      for (const uid of participantUserIds) {
        if (uid !== user?.userId) participants.push({ userId: uid })
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: type || 'direct',
        subject: subject || null,
        teamId: teamId || null,
        participants: {
          create: participants.map(p => ({
            parentId: p.parentId || null,
            userId: p.userId || null,
            lastReadAt: p.parentId === parentId || p.userId === user?.userId ? new Date() : null,
          })),
        },
        messages: {
          create: {
            content: message,
            senderParentId: parentId || null,
            senderUserId: parentId ? null : user?.userId || null,
          },
        },
      },
      select: { id: true },
    })

    return NextResponse.json({ id: conversation.id })
  } catch (error) {
    console.error('Failed to create conversation:', error)
    return NextResponse.json({ error: 'Eroare la crearea conversației' }, { status: 500 })
  }
}
