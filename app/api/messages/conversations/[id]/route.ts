import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getParentId } from '@/lib/parent-auth'

// GET - Get messages in a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  const parentId = await getParentId()

  if (!user && !parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Verify participant access
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            parent: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
          },
        },
        team: { select: { grupa: true } },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversație negăsită' }, { status: 404 })
    }

    // Check access (admin can see all, parent only their own)
    const isParticipant = conversation.participants.some(
      p => (parentId && p.parentId === parentId) || (user && p.userId === user.userId)
    )
    const isAdmin = user?.role === 'admin'

    if (!isParticipant && !isAdmin) {
      return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        senderParent: { select: { id: true, name: true } },
        senderUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Mark as read
    if (parentId) {
      await prisma.conversationParticipant.updateMany({
        where: { conversationId: id, parentId },
        data: { lastReadAt: new Date() },
      })
    } else if (user) {
      await prisma.conversationParticipant.updateMany({
        where: { conversationId: id, userId: user.userId },
        data: { lastReadAt: new Date() },
      })
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        type: conversation.type,
        subject: conversation.subject,
        teamName: conversation.team?.grupa || null,
        participants: conversation.participants.map(p => ({
          name: p.parent?.name || p.user?.name || 'Necunoscut',
          type: p.parentId ? 'parent' : 'admin',
          id: p.parentId || String(p.userId),
        })),
      },
      messages: messages.map(m => ({
        id: m.id,
        content: m.content,
        attachmentUrl: m.attachmentUrl,
        senderName: m.senderParent?.name || m.senderUser?.name || 'Necunoscut',
        senderType: m.senderParentId ? 'parent' : 'admin',
        senderId: m.senderParentId || String(m.senderUserId),
        isMe: (parentId && m.senderParentId === parentId) || (user && m.senderUserId === user.userId),
        createdAt: m.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to get conversation:', error)
    return NextResponse.json({ error: 'Eroare' }, { status: 500 })
  }
}

// POST - Send a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  const parentId = await getParentId()

  if (!user && !parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const { id } = await params
    const { content } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Mesajul nu poate fi gol' }, { status: 400 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        content: content.trim(),
        senderParentId: parentId || null,
        senderUserId: parentId ? null : user?.userId || null,
      },
      include: {
        senderParent: { select: { name: true } },
        senderUser: { select: { name: true } },
      },
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    // Mark as read for sender
    if (parentId) {
      await prisma.conversationParticipant.updateMany({
        where: { conversationId: id, parentId },
        data: { lastReadAt: new Date() },
      })
    } else if (user) {
      await prisma.conversationParticipant.updateMany({
        where: { conversationId: id, userId: user.userId },
        data: { lastReadAt: new Date() },
      })
    }

    return NextResponse.json({
      id: message.id,
      content: message.content,
      senderName: message.senderParent?.name || message.senderUser?.name || 'Necunoscut',
      senderType: message.senderParentId ? 'parent' : 'admin',
      isMe: true,
      createdAt: message.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json({ error: 'Eroare la trimiterea mesajului' }, { status: 500 })
  }
}
