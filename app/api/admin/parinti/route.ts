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

export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const parents = await prisma.parent.findMany({
    include: {
      children: {
        include: { team: { select: { id: true, grupa: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const result = parents.map(p => {
    const totalChildren = p.children.length
    const signedConsents = p.children.filter(c => c.photoConsentDate !== null).length
    const unsignedConsents = totalChildren - signedConsents

    return {
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      childrenCount: totalChildren,
      consentStats: {
        total: totalChildren,
        signed: signedConsents,
        unsigned: unsignedConsents,
      },
      children: p.children.map(c => ({
        id: c.id,
        name: c.name,
        birthYear: c.birthYear,
        teamId: c.teamId,
        teamName: c.team?.grupa ?? null,
        photoConsent: c.photoConsent,
        photoConsentDate: c.photoConsentDate,
      })),
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, email, phone, children, sendInvite } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Numele este obligatoriu (min. 2 caractere)' }, { status: 400 })
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email-ul este obligatoriu' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Adresa de email este invalida' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check for existing parent with same email
    const existing = await prisma.parent.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: 'Exista deja un parinte cu acest email' }, { status: 409 })
    }

    if (!children || !Array.isArray(children) || children.length === 0) {
      return NextResponse.json({ error: 'Trebuie adaugat cel putin un copil' }, { status: 400 })
    }

    // Validate children
    const currentYear = new Date().getFullYear()
    for (const child of children) {
      if (!child.name || typeof child.name !== 'string' || child.name.trim().length < 2) {
        return NextResponse.json({ error: 'Numele copilului este obligatoriu (min. 2 caractere)' }, { status: 400 })
      }
      const year = Number(child.birthYear)
      if (!year || year < currentYear - 20 || year > currentYear) {
        return NextResponse.json({ error: `Anul nasterii pentru ${child.name} este invalid` }, { status: 400 })
      }
      if (child.teamId !== null && child.teamId !== undefined) {
        const team = await prisma.team.findUnique({ where: { id: Number(child.teamId) } })
        if (!team) {
          return NextResponse.json({ error: `Echipa selectata pentru ${child.name} nu exista` }, { status: 400 })
        }
      }
    }

    // Create parent with children in a transaction
    const parent = await prisma.$transaction(async (tx) => {
      const newParent = await tx.parent.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || null,
        },
      })

      for (const child of children) {
        await tx.child.create({
          data: {
            name: child.name.trim(),
            birthYear: Number(child.birthYear),
            parentId: newParent.id,
            teamId: child.teamId ? Number(child.teamId) : null,
          },
        })
      }

      return await tx.parent.findUnique({
        where: { id: newParent.id },
        include: {
          children: {
            include: { team: { select: { id: true, grupa: true } } },
          },
        },
      })
    })

    // Send welcome/invite email if requested
    if (sendInvite && parent) {
      try {
        await transporter.sendMail({
          from: '"Dinamo Rugby Juniori" <noreply@dinamorugby.ro>',
          to: normalizedEmail,
          subject: 'Bun venit in Portalul Parinti — Dinamo Rugby Juniori',
          text: `Salut ${parent.name},\n\nContul tau a fost creat in Portalul Parintilor Dinamo Rugby Juniori.\n\nAcceseaza portalul la adresa:\n${SITE_URL}/parinti\n\nFoloseste adresa de email ${normalizedEmail} pentru a solicita un link de conectare.\n\n— Echipa Dinamo Rugby Juniori`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; padding: 20px 0;">
                <h2 style="color: #1e3a5f; margin: 0;">Dinamo Rugby Juniori</h2>
                <p style="color: #666; margin: 5px 0 0;">Portal Parinti</p>
              </div>
              <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
                <p style="margin: 0 0 15px;">Salut <strong>${parent.name}</strong>,</p>
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
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError)
        // Don't fail the request if email fails - parent was already created
      }
    }

    return NextResponse.json({
      success: true,
      parent: {
        id: parent!.id,
        name: parent!.name,
        email: parent!.email,
        phone: parent!.phone,
        children: parent!.children.map(c => ({
          id: c.id,
          name: c.name,
          birthYear: c.birthYear,
          teamId: c.teamId,
          teamName: c.team?.grupa ?? null,
        })),
      },
      emailSent: sendInvite ? true : false,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating parent:', error)
    return NextResponse.json({ error: 'Eroare la crearea parintelui' }, { status: 500 })
  }
}
