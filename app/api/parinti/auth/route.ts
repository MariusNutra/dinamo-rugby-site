import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
})

const magicLinkAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const now = Date.now()

  const record = magicLinkAttempts.get(ip)
  if (record) {
    if (now - record.lastAttempt > WINDOW_MS) {
      magicLinkAttempts.delete(ip)
    } else if (record.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Prea multe încercări. Reîncearcă mai târziu.' },
        { status: 429 }
      )
    }
  }

  const { email } = await req.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email-ul este obligatoriu' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Adresa de email este invalidă' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const token = randomBytes(32).toString('hex')
  const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  await prisma.parent.upsert({
    where: { email: normalizedEmail },
    update: { token, tokenExpiry },
    create: { email: normalizedEmail, name: '', token, tokenExpiry },
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const magicLink = `${siteUrl}/api/parinti/verify?token=${token}`

  try {
    await transporter.sendMail({
      from: `"Dinamo Rugby - Portal Părinți" <noreply@dinamorugby.ro>`,
      to: normalizedEmail,
      subject: 'Link de acces - Portal Părinți Dinamo Rugby',
      text: `Salut!\n\nAccesează linkul de mai jos pentru a intra în Portalul Părinților:\n\n${magicLink}\n\nLinkul expiră în 15 minute.\n\nDacă nu ai solicitat acest link, ignoră acest email.\n\n— Echipa Dinamo Rugby`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a5f;">Portal Părinți - Dinamo Rugby</h2>
          <p>Salut!</p>
          <p>Accesează butonul de mai jos pentru a intra în Portalul Părinților:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" style="background: #c41e3a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Intră în portal
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">Linkul expiră în 15 minute.</p>
          <p style="color: #666; font-size: 14px;">Dacă nu ai solicitat acest link, ignoră acest email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">Dinamo Rugby București</p>
        </div>
      `,
    })

    const current = magicLinkAttempts.get(ip)
    magicLinkAttempts.set(ip, { count: (current?.count || 0) + 1, lastAttempt: now })

    return NextResponse.json({ success: true, message: 'Link-ul a fost trimis pe email.' })
  } catch (error) {
    console.error('Magic link email error:', error)
    return NextResponse.json({ error: 'Eroare la trimiterea email-ului.' }, { status: 500 })
  }
}
