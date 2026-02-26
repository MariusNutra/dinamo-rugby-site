import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
})

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = await checkRateLimit(ip, {
    action: 'registration_form',
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,
  })

  if (!limit.allowed) {
    return NextResponse.json({ error: 'Prea multe cereri. Reincercati mai tarziu.' }, { status: 429 })
  }

  const body = await req.json()
  const { childFirstName, childLastName, birthDate, teamId, parentName, phone, email, experience, gdprConsent } = body

  if (!childFirstName || !childLastName || !birthDate || !parentName || !phone || !email) {
    return NextResponse.json({ error: 'Toate campurile obligatorii trebuie completate' }, { status: 400 })
  }

  if (!gdprConsent) {
    return NextResponse.json({ error: 'Acordul GDPR este obligatoriu' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Adresa de email este invalida' }, { status: 400 })
  }

  const registration = await prisma.registration.create({
    data: {
      childFirstName: String(childFirstName).slice(0, 100),
      childLastName: String(childLastName).slice(0, 100),
      birthDate: new Date(birthDate),
      teamId: teamId ? Number(teamId) : null,
      parentName: String(parentName).slice(0, 200),
      phone: String(phone).slice(0, 20),
      email: String(email).slice(0, 200),
      experience: experience ? String(experience).slice(0, 1000) : null,
      gdprConsent: true,
    },
    include: { team: true },
  })

  const safeName = escapeHtml(childFirstName + ' ' + childLastName)
  const safeParent = escapeHtml(parentName)
  const teamName = registration.team?.grupa || 'Nedecis'

  // Email to parent
  try {
    await transporter.sendMail({
      from: '"Dinamo Rugby Juniori" <contact@dinamorugby.ro>',
      to: email,
      subject: 'Confirmare inscriere - Dinamo Rugby Juniori',
      html: `
        <h2>Multumim pentru inscriere!</h2>
        <p>Am primit cererea de inscriere pentru <strong>${safeName}</strong>.</p>
        <p><strong>Grupa solicitata:</strong> ${escapeHtml(teamName)}</p>
        <p>Vom reveni cu un raspuns in cel mai scurt timp.</p>
        <hr />
        <p style="color: #888; font-size: 12px;">Dinamo Rugby Juniori - dinamorugby.ro</p>
      `,
    })
  } catch (e) {
    console.error('Registration confirmation email error:', e)
  }

  // Email to admin
  try {
    await transporter.sendMail({
      from: '"Inscrieri dinamorugby.ro" <contact@dinamorugby.ro>',
      to: 'contact@dinamorugby.ro',
      subject: `Inscriere noua: ${childFirstName} ${childLastName}`,
      html: `
        <h2>Inscriere noua</h2>
        <p><strong>Copil:</strong> ${safeName}</p>
        <p><strong>Data nasterii:</strong> ${new Date(birthDate).toLocaleDateString('ro-RO')}</p>
        <p><strong>Grupa dorita:</strong> ${escapeHtml(teamName)}</p>
        <p><strong>Parinte:</strong> ${safeParent}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Experienta:</strong> ${experience ? escapeHtml(experience) : 'Nu'}</p>
        <hr />
        <p><a href="https://dinamorugby.ro/admin/inscrieri">Vezi in admin</a></p>
      `,
    })
  } catch (e) {
    console.error('Registration admin notification email error:', e)
  }

  return NextResponse.json({ success: true, message: 'Inscrierea a fost trimisa cu succes!' }, { status: 201 })
}
