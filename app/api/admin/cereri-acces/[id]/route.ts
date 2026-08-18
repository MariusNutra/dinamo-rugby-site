import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'
import { sendEmail } from '@/lib/email'
import { trimiteInvitatieParinte, anuntaAprobareParinteCuParola } from '@/lib/invitatie-parinte'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authz = await requirePermission('requests.manage')
  if (authz.error) return authz.error

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

      // Contul nou n-are parola, deci mailul trebuie sa duca la setarea ei, nu la
      // portal — altfel parintele ajunge pe un formular pe care nu-l poate trece.
      const copiiPentruMail = [{ name: result.child.name, birthYear: result.child.birthYear, team: request.team }]
      const trimis = result.parent.password
        ? await anuntaAprobareParinteCuParola(result.parent, copiiPentruMail)
        : await trimiteInvitatieParinte(result.parent, copiiPentruMail, { aprobareCerere: true })

      if (!trimis) {
        console.error('Cererea a fost aprobata, dar mailul catre parinte nu a plecat:', result.parent.email)
      }

      return NextResponse.json({
        success: true,
        message: trimis ? 'Cererea a fost aprobata' : 'Cererea a fost aprobata, dar emailul nu a plecat',
        emailTrimis: trimis,
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

      const reasonText = reason ? `\n\nMotiv: ${reason}` : ''
      const reasonHtml = reason ? `<p style="margin: 0 0 15px; color: #666;">Motiv: ${reason}</p>` : ''

      const trimis = await sendEmail({
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

      if (!trimis) {
        console.error('Cererea a fost respinsa, dar mailul catre parinte nu a plecat:', request.email)
      }

      return NextResponse.json({
        success: true,
        message: trimis ? 'Cererea a fost respinsa' : 'Cererea a fost respinsa, dar emailul nu a plecat',
        emailTrimis: trimis,
      })
    }
  } catch (error) {
    console.error('Error processing access request:', error)
    return NextResponse.json({ error: 'Eroare la procesarea cererii' }, { status: 500 })
  }
}
