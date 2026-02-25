import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
})

const contactAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_CONTACT = 5
const CONTACT_WINDOW = 60 * 60 * 1000 // 1 hour

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const now = Date.now()
  const record = contactAttempts.get(ip)
  if (record) {
    if (now - record.lastAttempt > CONTACT_WINDOW) {
      contactAttempts.delete(ip)
    } else if (record.count >= MAX_CONTACT) {
      return NextResponse.json(
        { error: 'Prea multe mesaje trimise. Reîncearcă mai târziu.' },
        { status: 429 }
      )
    }
  }

  const { name, email, message } = await req.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Toate câmpurile sunt obligatorii' }, { status: 400 })
  }

  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    return NextResponse.json({ error: 'Textul depășește limita permisă' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Adresa de email este invalidă' }, { status: 400 })
  }

  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>')

  try {
    await transporter.sendMail({
      from: `"Formular Contact dinamorugby.ro" <contact@dinamorugby.ro>`,
      to: 'contact@dinamorugby.ro',
      replyTo: email,
      subject: `Mesaj nou de la ${name.slice(0, 100)}`,
      text: `Nume: ${name}\nEmail: ${email}\n\nMesaj:\n${message}`,
      html: `
        <h2>Mesaj nou din formularul de contact</h2>
        <p><strong>Nume:</strong> ${safeName}</p>
        <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <hr />
        <p><strong>Mesaj:</strong></p>
        <p>${safeMessage}</p>
        <hr />
        <p style="color: #888; font-size: 12px;">Trimis prin formularul de contact de pe dinamorugby.ro</p>
      `,
    })

    const current = contactAttempts.get(ip)
    contactAttempts.set(ip, { count: (current?.count || 0) + 1, lastAttempt: now })

    return NextResponse.json({ success: true, message: 'Mesajul a fost trimis cu succes!' })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Eroare la trimiterea mesajului' }, { status: 500 })
  }
}
