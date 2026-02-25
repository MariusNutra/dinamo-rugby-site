import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
})

const magicLinkAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60 * 60 * 1000

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
        { error: 'Prea multe incercari. Reincearca mai tarziu.' },
        { status: 429 }
      )
    }
  }

  const { email } = await req.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email-ul este obligatoriu.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Adresa de email este invalida.' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Only allow existing parents to login
  const parent = await prisma.parent.findUnique({ where: { email: normalizedEmail } })
  if (!parent) {
    return NextResponse.json({
      error: 'not_registered',
      message: 'Acest email nu este inregistrat. Solicita acces mai jos sau contacteaza antrenorul.',
    }, { status: 404 })
  }

  const token = randomBytes(32).toString('hex')
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.parent.update({
    where: { id: parent.id },
    data: { token, tokenExpiry },
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const magicLink = `${siteUrl}/api/parinti/verify?token=${token}`

  try {
    await transporter.sendMail({
      from: '"Dinamo Rugby Juniori" <noreply@dinamorugby.ro>',
      to: normalizedEmail,
      subject: 'Conectare Portal Parinti — Dinamo Rugby Juniori',
      text: `Salut ${parent.name},\n\nAcceseaza linkul de mai jos pentru a intra in Portalul Parintilor:\n\n${magicLink}\n\nLinkul expira in 24 de ore.\n\nDaca nu ai solicitat acest link, ignora acest email.\n\n— Echipa Dinamo Rugby Juniori`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px 0;">
            <h2 style="color: #1e3a5f; margin: 0;">Dinamo Rugby Juniori</h2>
            <p style="color: #666; margin: 5px 0 0;">Portal Parinti</p>
          </div>
          <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
            <p style="margin: 0 0 15px;">Salut <strong>${parent.name}</strong>,</p>
            <p style="margin: 0 0 25px;">Apasa butonul de mai jos pentru a accesa portalul parintilor:</p>
            <p style="text-align: center; margin: 0 0 25px;">
              <a href="${magicLink}" style="background: #DC2626; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Acceseaza Portalul
              </a>
            </p>
            <p style="color: #666; font-size: 13px; margin: 0;">Linkul expira in 24 de ore.</p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">
            Daca nu ai solicitat acest link, ignora acest email.
          </p>
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
