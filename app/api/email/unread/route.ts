import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const host = process.env.EMAIL_IMAP_HOST
  const port = parseInt(process.env.EMAIL_IMAP_PORT || '993')
  const user = process.env.EMAIL_IMAP_USER
  const pass = process.env.EMAIL_IMAP_PASS

  if (!host || !user || !pass) {
    return NextResponse.json({ unread: null })
  }

  try {
    const { ImapFlow } = await import('imapflow')
    const client = new ImapFlow({
      host,
      port,
      secure: true,
      auth: { user, pass },
      logger: false,
    })

    await client.connect()
    await client.mailboxOpen('INBOX')
    const status = await client.status('INBOX', { unseen: true })
    const unread = status.unseen ?? 0
    await client.logout()

    return NextResponse.json({ unread })
  } catch {
    return NextResponse.json({ unread: null })
  }
}
