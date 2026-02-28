import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params

  try {
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: {
        children: {
          include: { team: { select: { grupa: true } } },
        },
      },
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parintele nu a fost gasit' }, { status: 404 })
    }

    const childrenList = parent.children
      .map(c => `- ${c.name} (${c.birthYear})${c.team ? ` — ${c.team.grupa}` : ''}`)
      .join('\n')

    const childrenListHtml = parent.children
      .map(c => `<li>${c.name} (${c.birthYear})${c.team ? ` — ${c.team.grupa}` : ''}</li>`)
      .join('')

    await transporter.sendMail({
      from: '"Dinamo Rugby Juniori" <noreply@dinamorugby.ro>',
      to: parent.email,
      subject: 'Bun venit in Portalul Parinti — Dinamo Rugby Juniori',
      text: `Salut ${parent.name},\n\nContul tau a fost creat in Portalul Parintilor Dinamo Rugby Juniori.\n\nCopii inregistrati:\n${childrenList}\n\nAcceseaza portalul la adresa:\n${SITE_URL}/parinti\n\nFoloseste adresa de email ${parent.email} pentru a solicita un link de conectare.\n\n— Echipa Dinamo Rugby Juniori`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px 0;">
            <h2 style="color: #1e3a5f; margin: 0;">Dinamo Rugby Juniori</h2>
            <p style="color: #666; margin: 5px 0 0;">Portal Parinti</p>
          </div>
          <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
            <p style="margin: 0 0 15px;">Salut <strong>${parent.name}</strong>,</p>
            <p style="margin: 0 0 15px;">Contul tau a fost creat in Portalul Parintilor Dinamo Rugby Juniori.</p>
            <p style="margin: 0 0 10px;">Copii inregistrati:</p>
            <ul style="margin: 0 0 20px; padding-left: 20px;">${childrenListHtml}</ul>
            <p style="margin: 0 0 25px;">Acceseaza portalul pentru a semna acordurile foto si a gestiona datele copiilor tai:</p>
            <p style="text-align: center; margin: 0 0 25px;">
              <a href="${SITE_URL}/parinti" style="background: #DC2626; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Acceseaza Portalul
              </a>
            </p>
            <p style="color: #666; font-size: 13px; margin: 0;">Foloseste adresa <strong>${parent.email}</strong> pentru a solicita un link de conectare.</p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">
            Acest email a fost trimis de echipa Dinamo Rugby Juniori.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'Invitatia a fost trimisa' })
  } catch (error) {
    console.error('Error sending invite:', error)
    return NextResponse.json({ error: 'Eroare la trimiterea invitatiei' }, { status: 500 })
  }
}
