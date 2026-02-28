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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const { action, reason } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Actiunea trebuie sa fie "approve" sau "reject"' }, { status: 400 })
    }

    const request = await prisma.accessRequest.findUnique({
      where: { id },
      include: { team: { select: { id: true, grupa: true } } },
    })

    if (!request) {
      return NextResponse.json({ error: 'Cererea nu a fost gasita' }, { status: 404 })
    }

    if (request.status !== 'pending') {
      return NextResponse.json({ error: 'Aceasta cerere a fost deja procesata' }, { status: 400 })
    }

    if (action === 'approve') {
      // Create Parent + Child from AccessRequest data in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Check if parent with this email already exists
        let parent = await tx.parent.findUnique({
          where: { email: request.email.toLowerCase().trim() },
        })

        if (!parent) {
          parent = await tx.parent.create({
            data: {
              name: request.parentName.trim(),
              email: request.email.toLowerCase().trim(),
              phone: request.phone?.trim() || null,
            },
          })
        }

        // Create child linked to parent
        const child = await tx.child.create({
          data: {
            name: request.childName.trim(),
            birthYear: request.childBirthYear,
            parentId: parent.id,
            teamId: request.teamId,
          },
        })

        // Update access request status
        const updatedRequest = await tx.accessRequest.update({
          where: { id },
          data: {
            status: 'approved',
            reviewedAt: new Date(),
          },
        })

        return { parent, child, updatedRequest }
      })

      // Send approval email
      try {
        await transporter.sendMail({
          from: '"Dinamo Rugby Juniori" <noreply@dinamorugby.ro>',
          to: request.email,
          subject: 'Cererea ta a fost aprobata — Dinamo Rugby Juniori',
          text: `Salut ${request.parentName},\n\nCererea ta de acces la Portalul Parintilor a fost aprobata!\n\nCopilul ${request.childName} a fost inregistrat${request.team ? ` in grupa ${request.team.grupa}` : ''}.\n\nAcceseaza portalul la adresa:\n${SITE_URL}/parinti\n\nFoloseste adresa de email ${request.email} pentru a solicita un link de conectare.\n\n— Echipa Dinamo Rugby Juniori`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; padding: 20px 0;">
                <h2 style="color: #1e3a5f; margin: 0;">Dinamo Rugby Juniori</h2>
                <p style="color: #666; margin: 5px 0 0;">Portal Parinti</p>
              </div>
              <div style="background: #f0fdf4; border-radius: 8px; padding: 30px; margin: 20px 0;">
                <p style="margin: 0 0 15px;">Salut <strong>${request.parentName}</strong>,</p>
                <p style="margin: 0 0 15px; color: #16a34a; font-weight: bold;">Cererea ta de acces a fost aprobata!</p>
                <p style="margin: 0 0 15px;">Copilul <strong>${request.childName}</strong> a fost inregistrat${request.team ? ` in grupa <strong>${request.team.grupa}</strong>` : ''}.</p>
                <p style="margin: 0 0 25px;">Acceseaza portalul pentru a semna acordurile foto si a gestiona datele:</p>
                <p style="text-align: center; margin: 0 0 25px;">
                  <a href="${SITE_URL}/parinti" style="background: #DC2626; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Acceseaza Portalul
                  </a>
                </p>
                <p style="color: #666; font-size: 13px; margin: 0;">Foloseste adresa <strong>${request.email}</strong> pentru a solicita un link de conectare.</p>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center;">
                Acest email a fost trimis de echipa Dinamo Rugby Juniori.
              </p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error('Error sending approval email:', emailError)
      }

      return NextResponse.json({
        success: true,
        message: 'Cererea a fost aprobata',
        parent: { id: result.parent.id, name: result.parent.name },
        child: { id: result.child.id, name: result.child.name },
      })
    } else {
      // Reject
      await prisma.accessRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          reviewedAt: new Date(),
        },
      })

      // Send rejection email
      try {
        const reasonText = reason ? `\n\nMotiv: ${reason}` : ''
        const reasonHtml = reason ? `<p style="margin: 0 0 15px; color: #666;">Motiv: ${reason}</p>` : ''

        await transporter.sendMail({
          from: '"Dinamo Rugby Juniori" <noreply@dinamorugby.ro>',
          to: request.email,
          subject: 'Actualizare cerere acces — Dinamo Rugby Juniori',
          text: `Salut ${request.parentName},\n\nDin pacate, cererea ta de acces la Portalul Parintilor nu a fost aprobata.${reasonText}\n\nPentru mai multe informatii, contacteaza echipa Dinamo Rugby Juniori.\n\n— Echipa Dinamo Rugby Juniori`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; padding: 20px 0;">
                <h2 style="color: #1e3a5f; margin: 0;">Dinamo Rugby Juniori</h2>
                <p style="color: #666; margin: 5px 0 0;">Portal Parinti</p>
              </div>
              <div style="background: #fef2f2; border-radius: 8px; padding: 30px; margin: 20px 0;">
                <p style="margin: 0 0 15px;">Salut <strong>${request.parentName}</strong>,</p>
                <p style="margin: 0 0 15px;">Din pacate, cererea ta de acces la Portalul Parintilor nu a fost aprobata.</p>
                ${reasonHtml}
                <p style="margin: 0;">Pentru mai multe informatii, contacteaza echipa Dinamo Rugby Juniori.</p>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center;">
                Acest email a fost trimis de echipa Dinamo Rugby Juniori.
              </p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError)
      }

      return NextResponse.json({ success: true, message: 'Cererea a fost respinsa' })
    }
  } catch (error) {
    console.error('Error processing access request:', error)
    return NextResponse.json({ error: 'Eroare la procesarea cererii' }, { status: 500 })
  }
}
