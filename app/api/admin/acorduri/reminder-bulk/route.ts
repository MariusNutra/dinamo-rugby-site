import { NextResponse } from 'next/server'
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

export async function POST() {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    // Find all children with unsigned consents, grouped by parent
    const unsignedChildren = await prisma.child.findMany({
      where: { photoConsentDate: null },
      include: {
        parent: { select: { id: true, name: true, email: true } },
        team: { select: { grupa: true } },
      },
      orderBy: [{ parent: { name: 'asc' } }, { name: 'asc' }],
    })

    if (unsignedChildren.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nu exista acorduri nesemnate',
        sent: 0,
        failed: 0,
      })
    }

    // Group children by parent email
    const parentGroups: Record<string, {
      parentName: string
      parentEmail: string
      children: Array<{ name: string; teamName: string | null }>
    }> = {}

    for (const child of unsignedChildren) {
      const key = child.parent.email
      if (!parentGroups[key]) {
        parentGroups[key] = {
          parentName: child.parent.name,
          parentEmail: child.parent.email,
          children: [],
        }
      }
      parentGroups[key].children.push({
        name: child.name,
        teamName: child.team?.grupa ?? null,
      })
    }

    const parentEmails = Object.keys(parentGroups)
    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const email of parentEmails) {
      const data = parentGroups[email]
      try {
        const childrenListText = data.children
          .map(c => `- ${c.name}${c.teamName ? ` (${c.teamName})` : ''}`)
          .join('\n')

        const childrenListHtml = data.children
          .map(c => `<li><strong>${c.name}</strong>${c.teamName ? ` — ${c.teamName}` : ''}</li>`)
          .join('')

        const plural = data.children.length > 1

        await transporter.sendMail({
          from: '"Dinamo Rugby Juniori" <noreply@dinamorugby.ro>',
          to: email,
          subject: `Reminder: Acord${plural ? 'uri' : ''} foto nesemnat${plural ? 'e' : ''} — Dinamo Rugby Juniori`,
          text: `Salut ${data.parentName},\n\nIti reamintim ca ${plural ? 'acordurile foto pentru urmatorii copii nu au fost inca semnate' : 'acordul foto nu a fost inca semnat'}:\n\n${childrenListText}\n\nTe rugam sa accesezi Portalul Parintilor si sa ${plural ? 'semnezi acordurile' : 'semnezi acordul'} cat mai curand:\n${SITE_URL}/parinti\n\nMultumim!\n\n— Echipa Dinamo Rugby Juniori`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; padding: 20px 0;">
                <h2 style="color: #1e3a5f; margin: 0;">Dinamo Rugby Juniori</h2>
                <p style="color: #666; margin: 5px 0 0;">Portal Parinti</p>
              </div>
              <div style="background: #fffbeb; border-radius: 8px; padding: 30px; margin: 20px 0;">
                <p style="margin: 0 0 15px;">Salut <strong>${data.parentName}</strong>,</p>
                <p style="margin: 0 0 15px;">Iti reamintim ca ${plural ? 'acordurile foto pentru urmatorii copii nu au fost inca semnate' : 'acordul foto nu a fost inca semnat pentru'}:</p>
                <ul style="margin: 0 0 20px; padding-left: 20px;">${childrenListHtml}</ul>
                <p style="margin: 0 0 25px;">Te rugam sa accesezi portalul si sa ${plural ? 'semnezi acordurile' : 'semnezi acordul'} cat mai curand:</p>
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

        sent++
      } catch (emailError) {
        failed++
        errors.push(`${email}: ${emailError instanceof Error ? emailError.message : 'Eroare necunoscuta'}`)
        console.error(`Error sending bulk reminder to ${email}:`, emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reminder-uri trimise: ${sent} din ${parentEmails.length}`,
      sent,
      failed,
      totalParents: parentEmails.length,
      totalUnsignedChildren: unsignedChildren.length,
      ...(errors.length > 0 && { errors }),
    })
  } catch (error) {
    console.error('Error sending bulk reminders:', error)
    return NextResponse.json({ error: 'Eroare la trimiterea reminder-urilor' }, { status: 500 })
  }
}
