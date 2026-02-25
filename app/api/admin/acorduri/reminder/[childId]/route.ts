import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
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
  { params }: { params: Promise<{ childId: string }> }
) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { childId } = await params

  try {
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        parent: { select: { id: true, name: true, email: true } },
        team: { select: { grupa: true } },
      },
    })

    if (!child) {
      return NextResponse.json({ error: 'Copilul nu a fost gasit' }, { status: 404 })
    }

    if (child.photoConsentDate) {
      return NextResponse.json({ error: 'Acordul foto a fost deja semnat' }, { status: 400 })
    }

    const teamInfo = child.team ? ` (${child.team.grupa})` : ''

    await transporter.sendMail({
      from: '"Dinamo Rugby Juniori" <noreply@dinamorugby.ro>',
      to: child.parent.email,
      subject: 'Reminder: Acord foto nesemnat — Dinamo Rugby Juniori',
      text: `Salut ${child.parent.name},\n\nIti reamintim ca acordul foto pentru ${child.name}${teamInfo} nu a fost inca semnat.\n\nTe rugam sa accesezi Portalul Parintilor si sa semnezi acordul cat mai curand:\n${SITE_URL}/parinti\n\nMultumim!\n\n— Echipa Dinamo Rugby Juniori`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px 0;">
            <h2 style="color: #1e3a5f; margin: 0;">Dinamo Rugby Juniori</h2>
            <p style="color: #666; margin: 5px 0 0;">Portal Parinti</p>
          </div>
          <div style="background: #fffbeb; border-radius: 8px; padding: 30px; margin: 20px 0;">
            <p style="margin: 0 0 15px;">Salut <strong>${child.parent.name}</strong>,</p>
            <p style="margin: 0 0 15px;">Iti reamintim ca acordul foto pentru <strong>${child.name}</strong>${teamInfo} nu a fost inca semnat.</p>
            <p style="margin: 0 0 25px;">Te rugam sa accesezi portalul si sa semnezi acordul cat mai curand:</p>
            <p style="text-align: center; margin: 0 0 25px;">
              <a href="${SITE_URL}/parinti" style="background: #DC2626; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Semneaza Acordul
              </a>
            </p>
            <p style="color: #666; font-size: 13px; margin: 0;">Daca ai semnat deja acordul, te rugam sa ignori acest email.</p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">
            Acest email a fost trimis de echipa Dinamo Rugby Juniori.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: `Reminder trimis catre ${child.parent.email}` })
  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json({ error: 'Eroare la trimiterea reminder-ului' }, { status: 500 })
  }
}
