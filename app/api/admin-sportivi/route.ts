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

export async function POST(req: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { nume, prenume, birthYear, teamId, parentId, newParent, sendInvite } = body

    // Validate name
    if (!nume || typeof nume !== 'string' || nume.trim().length < 2) {
      return NextResponse.json({ error: 'Numele este obligatoriu (min. 2 caractere)' }, { status: 400 })
    }
    if (!prenume || typeof prenume !== 'string' || prenume.trim().length < 2) {
      return NextResponse.json({ error: 'Prenumele este obligatoriu (min. 2 caractere)' }, { status: 400 })
    }

    // Validate birth year
    const year = Number(birthYear)
    if (!year || year < 2005 || year > 2022) {
      return NextResponse.json({ error: 'Anul nasterii trebuie sa fie intre 2005 si 2022' }, { status: 400 })
    }

    // Validate team if provided
    if (teamId) {
      const team = await prisma.team.findUnique({ where: { id: Number(teamId) } })
      if (!team) {
        return NextResponse.json({ error: 'Echipa selectata nu exista' }, { status: 400 })
      }
    }

    // Must have either parentId or newParent
    if (!parentId && !newParent) {
      return NextResponse.json({ error: 'Selecteaza un parinte existent sau completeaza datele pentru parinte nou' }, { status: 400 })
    }

    const childName = `${nume.trim()} ${prenume.trim()}`

    if (parentId) {
      // Existing parent
      const parent = await prisma.parent.findUnique({ where: { id: parentId } })
      if (!parent) {
        return NextResponse.json({ error: 'Parintele selectat nu exista' }, { status: 404 })
      }

      const child = await prisma.child.create({
        data: {
          name: childName,
          birthYear: year,
          parentId: parentId,
          teamId: teamId ? Number(teamId) : null,
        },
        include: {
          team: { select: { id: true, grupa: true } },
          parent: { select: { id: true, name: true } },
        },
      })

      return NextResponse.json({
        success: true,
        child: {
          id: child.id,
          name: child.name,
          birthYear: child.birthYear,
          teamId: child.teamId,
          teamName: child.team?.grupa ?? null,
          parentName: child.parent.name,
        },
      }, { status: 201 })
    } else {
      // New parent
      const { name: parentName, email: parentEmail, phone: parentPhone } = newParent

      if (!parentName || typeof parentName !== 'string' || parentName.trim().length < 2) {
        return NextResponse.json({ error: 'Numele parintelui este obligatoriu (min. 2 caractere)' }, { status: 400 })
      }
      if (!parentEmail || typeof parentEmail !== 'string') {
        return NextResponse.json({ error: 'Email-ul parintelui este obligatoriu' }, { status: 400 })
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(parentEmail)) {
        return NextResponse.json({ error: 'Adresa de email este invalida' }, { status: 400 })
      }

      const normalizedEmail = parentEmail.toLowerCase().trim()

      // Check email uniqueness
      const existing = await prisma.parent.findUnique({ where: { email: normalizedEmail } })
      if (existing) {
        return NextResponse.json({ error: 'Exista deja un parinte cu acest email. Selecteaza-l din lista.' }, { status: 409 })
      }

      // Create parent + child in transaction
      const result = await prisma.$transaction(async (tx) => {
        const parent = await tx.parent.create({
          data: {
            name: parentName.trim(),
            email: normalizedEmail,
            phone: parentPhone?.trim() || null,
          },
        })

        const child = await tx.child.create({
          data: {
            name: childName,
            birthYear: year,
            parentId: parent.id,
            teamId: teamId ? Number(teamId) : null,
          },
          include: {
            team: { select: { id: true, grupa: true } },
          },
        })

        return { parent, child }
      })

      // Send welcome/invite email if requested
      let emailSent = false
      if (sendInvite && result.parent) {
        try {
          await transporter.sendMail({
            from: '"Dinamo Rugby Juniori" <noreply@dinamorugby.ro>',
            to: normalizedEmail,
            subject: 'Bun venit in Portalul Parinti — Dinamo Rugby Juniori',
            text: `Salut ${result.parent.name},\n\nContul tau a fost creat in Portalul Parintilor Dinamo Rugby Juniori.\n\nAcceseaza portalul la adresa:\n${SITE_URL}/parinti\n\nFoloseste adresa de email ${normalizedEmail} pentru a solicita un link de conectare.\n\n— Echipa Dinamo Rugby Juniori`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; padding: 20px 0;">
                  <h2 style="color: #1e3a5f; margin: 0;">Dinamo Rugby Juniori</h2>
                  <p style="color: #666; margin: 5px 0 0;">Portal Parinti</p>
                </div>
                <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
                  <p style="margin: 0 0 15px;">Salut <strong>${result.parent.name}</strong>,</p>
                  <p style="margin: 0 0 15px;">Contul tau a fost creat in Portalul Parintilor Dinamo Rugby Juniori.</p>
                  <p style="margin: 0 0 25px;">Acceseaza portalul pentru a semna acordurile foto si a gestiona datele copiilor tai:</p>
                  <p style="text-align: center; margin: 0 0 25px;">
                    <a href="${SITE_URL}/parinti" style="background: #DC2626; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                      Acceseaza Portalul
                    </a>
                  </p>
                  <p style="color: #666; font-size: 13px; margin: 0;">Foloseste adresa <strong>${normalizedEmail}</strong> pentru a solicita un link de conectare.</p>
                </div>
                <p style="color: #999; font-size: 12px; text-align: center;">
                  Acest email a fost trimis de echipa Dinamo Rugby Juniori.
                </p>
              </div>
            `,
          })
          emailSent = true
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError)
          // Don't fail the request if email fails - parent was already created
        }
      }

      return NextResponse.json({
        success: true,
        child: {
          id: result.child.id,
          name: result.child.name,
          birthYear: result.child.birthYear,
          teamId: result.child.teamId,
          teamName: result.child.team?.grupa ?? null,
          parentName: result.parent.name,
        },
        emailSent,
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating child:', error)
    return NextResponse.json({ error: 'Eroare la crearea sportivului' }, { status: 500 })
  }
}
