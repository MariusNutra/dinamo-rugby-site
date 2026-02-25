import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
  tls: { rejectUnauthorized: false },
})

// Rate limit: 3 requests per day per email
const accessAttempts = new Map<string, { count: number; firstAttempt: number }>()
const MAX_REQUESTS = 3
const WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const { parentName, email, phone, childName, childBirthYear, teamId, message } = body

  // --- Validation ---
  if (!parentName || typeof parentName !== 'string' || parentName.trim().length < 2) {
    return NextResponse.json({ error: 'Numele parintelui este obligatoriu (min. 2 caractere).' }, { status: 400 })
  }
  if (parentName.length > 200) {
    return NextResponse.json({ error: 'Numele parintelui este prea lung.' }, { status: 400 })
  }

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email-ul este obligatoriu.' }, { status: 400 })
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email) || email.length > 200) {
    return NextResponse.json({ error: 'Adresa de email este invalida.' }, { status: 400 })
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 6) {
    return NextResponse.json({ error: 'Numarul de telefon este obligatoriu.' }, { status: 400 })
  }
  if (phone.length > 20) {
    return NextResponse.json({ error: 'Numarul de telefon este prea lung.' }, { status: 400 })
  }

  if (!childName || typeof childName !== 'string' || childName.trim().length < 2) {
    return NextResponse.json({ error: 'Numele copilului este obligatoriu (min. 2 caractere).' }, { status: 400 })
  }
  if (childName.length > 200) {
    return NextResponse.json({ error: 'Numele copilului este prea lung.' }, { status: 400 })
  }

  if (!childBirthYear || typeof childBirthYear !== 'number') {
    return NextResponse.json({ error: 'Anul nasterii copilului este obligatoriu.' }, { status: 400 })
  }
  const currentYear = new Date().getFullYear()
  if (childBirthYear < currentYear - 20 || childBirthYear > currentYear - 3) {
    return NextResponse.json({ error: 'Anul nasterii copilului este invalid.' }, { status: 400 })
  }

  // teamId is optional, but if provided must be a valid Int
  let resolvedTeamId: number | null = null
  if (teamId !== undefined && teamId !== null) {
    if (typeof teamId !== 'number' || !Number.isInteger(teamId)) {
      return NextResponse.json({ error: 'Grupa selectata este invalida.' }, { status: 400 })
    }
    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return NextResponse.json({ error: 'Grupa selectata nu exista.' }, { status: 400 })
    }
    resolvedTeamId = teamId
  }

  if (message && (typeof message !== 'string' || message.length > 2000)) {
    return NextResponse.json({ error: 'Mesajul este prea lung (max. 2000 caractere).' }, { status: 400 })
  }

  // --- Rate limiting by email ---
  const normalizedEmail = email.toLowerCase().trim()
  const now = Date.now()
  const record = accessAttempts.get(normalizedEmail)
  if (record) {
    if (now - record.firstAttempt > WINDOW_MS) {
      accessAttempts.delete(normalizedEmail)
    } else if (record.count >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Ai trimis deja cereri astazi. Reincearca maine.' },
        { status: 429 }
      )
    }
  }

  // --- Create DB record ---
  try {
    const accessRequest = await prisma.accessRequest.create({
      data: {
        parentName: parentName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        childName: childName.trim(),
        childBirthYear,
        teamId: resolvedTeamId,
        message: message ? (message as string).trim() : null,
      },
    })

    // --- Look up team name for email ---
    let teamName = 'Nespecificata'
    if (resolvedTeamId) {
      const team = await prisma.team.findUnique({
        where: { id: resolvedTeamId },
        select: { grupa: true },
      })
      if (team) teamName = team.grupa
    }

    // --- Send notification email ---
    const safeName = escapeHtml(parentName.trim())
    const safeEmail = escapeHtml(normalizedEmail)
    const safePhone = escapeHtml(phone.trim())
    const safeChildName = escapeHtml(childName.trim())
    const safeMessage = message ? escapeHtml((message as string).trim()).replace(/\n/g, '<br>') : ''

    try {
      await transporter.sendMail({
        from: '"Portal Parinti dinamorugby.ro" <noreply@dinamorugby.ro>',
        to: 'contact@dinamorugby.ro',
        replyTo: normalizedEmail,
        subject: `Cerere noua Portal Parinti — ${parentName.trim().slice(0, 50)} pentru ${childName.trim().slice(0, 50)} la ${teamName}`,
        text: [
          `Cerere noua de acces in Portalul Parintilor`,
          ``,
          `Parinte: ${parentName.trim()}`,
          `Email: ${normalizedEmail}`,
          `Telefon: ${phone.trim()}`,
          `Copil: ${childName.trim()}`,
          `An nastere: ${childBirthYear}`,
          `Grupa: ${teamName}`,
          message ? `\nMesaj:\n${message}` : '',
          ``,
          `ID cerere: ${accessRequest.id}`,
          `Data: ${new Date().toLocaleString('ro-RO')}`,
        ].filter(Boolean).join('\n'),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a5f;">Cerere noua de acces &mdash; Portal Parinti</h2>
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 15px 0;">
              <p><strong>Parinte:</strong> ${safeName}</p>
              <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
              <p><strong>Telefon:</strong> ${safePhone}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb;" />
              <p><strong>Copil:</strong> ${safeChildName}</p>
              <p><strong>An nastere:</strong> ${childBirthYear}</p>
              <p><strong>Grupa:</strong> ${escapeHtml(teamName)}</p>
              ${safeMessage ? `<hr style="border: none; border-top: 1px solid #e5e7eb;" /><p><strong>Mesaj:</strong></p><p>${safeMessage}</p>` : ''}
            </div>
            <p style="color: #999; font-size: 12px;">ID cerere: ${accessRequest.id} | ${new Date().toLocaleString('ro-RO')}</p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Access request notification email error:', emailError)
      // Don't fail the request — the DB record was created successfully
    }

    // --- Update rate limit ---
    const current = accessAttempts.get(normalizedEmail)
    accessAttempts.set(normalizedEmail, {
      count: (current?.count || 0) + 1,
      firstAttempt: current?.firstAttempt || now,
    })

    return NextResponse.json({
      success: true,
      message: 'Cererea a fost trimisa cu succes! Vei primi un email cand contul este activat.',
    })
  } catch (error) {
    console.error('Access request error:', error)
    return NextResponse.json({ error: 'Eroare la trimiterea cererii. Incearca din nou.' }, { status: 500 })
  }
}
