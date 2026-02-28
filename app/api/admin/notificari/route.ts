import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import nodemailer from 'nodemailer'
import { sendPushToAll, sendPushToTeam } from '@/lib/web-push'

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
})

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const notifications = await prisma.notification.findMany({
    orderBy: { sentAt: 'desc' },
  })

  return NextResponse.json(notifications)
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const { title, body, type, recipientGroup, teamId } = await req.json()

  if (!title || !body || !type || !recipientGroup) {
    return NextResponse.json(
      { error: 'Toate campurile sunt obligatorii' },
      { status: 400 }
    )
  }

  const validTypes = ['anulare_antrenament', 'schimbare_program', 'meci_nou', 'general']
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Tip invalid' }, { status: 400 })
  }

  let recipients: { email: string; name: string }[] = []

  if (recipientGroup === 'all') {
    const parents = await prisma.parent.findMany({
      select: { email: true, name: true },
    })
    recipients = parents
  } else if (recipientGroup === 'team') {
    if (!teamId) {
      return NextResponse.json(
        { error: 'Selecteaza o echipa' },
        { status: 400 }
      )
    }
    const parents = await prisma.parent.findMany({
      where: {
        children: {
          some: { teamId: Number(teamId) },
        },
      },
      select: { email: true, name: true },
    })
    recipients = parents
  } else {
    // Individual email address
    recipients = [{ email: recipientGroup, name: recipientGroup }]
  }

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: 'Nu s-au gasit destinatari' },
      { status: 400 }
    )
  }

  let sent = 0
  for (const recipient of recipients) {
    try {
      await transporter.sendMail({
        from: '"Dinamo Rugby Juniori" <contact@dinamorugby.ro>',
        to: recipient.email,
        subject: title,
        text: body,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1e3a5f; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px;">Dinamo Rugby Juniori</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #1e3a5f; margin-top: 0;">${title}</h2>
              <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">${body}</div>
            </div>
            <div style="padding: 15px; text-align: center; color: #999; font-size: 12px;">
              Dinamo Rugby Juniori - Sectia Juniori
            </div>
          </div>
        `,
      })
      sent++
    } catch (err) {
      console.error(`Failed to send notification to ${recipient.email}:`, err)
    }
  }

  // Send push notifications in parallel
  let pushSent = 0
  try {
    const pushPayload = { title, body, url: '/parinti/dashboard' }
    if (recipientGroup === 'all') {
      pushSent = await sendPushToAll(pushPayload)
    } else if (recipientGroup === 'team' && teamId) {
      pushSent = await sendPushToTeam(Number(teamId), pushPayload)
    }
  } catch (err) {
    console.error('Push notification error:', err)
  }

  const notification = await prisma.notification.create({
    data: {
      title,
      body,
      type,
      recipientGroup,
      recipientCount: sent,
      sentAt: new Date(),
      sentBy: 'admin',
    },
  })

  return NextResponse.json({ success: true, sent, pushSent, notification })
}
