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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { childId } = await params

  try {
    const body = await req.json()
    const { toTeamId, reason } = body

    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        team: { select: { id: true, grupa: true } },
        parent: { select: { id: true, name: true, email: true } },
      },
    })

    if (!child) {
      return NextResponse.json({ error: 'Sportivul nu a fost gasit' }, { status: 404 })
    }

    const fromTeamId = child.teamId
    const parsedToTeamId = toTeamId !== null && toTeamId !== undefined ? Number(toTeamId) : null

    // Cannot transfer to same team
    if (fromTeamId === parsedToTeamId) {
      return NextResponse.json({ error: 'Sportivul este deja in aceasta echipa' }, { status: 400 })
    }

    // Validate target team exists
    let toTeam = null
    if (parsedToTeamId !== null) {
      toTeam = await prisma.team.findUnique({ where: { id: parsedToTeamId } })
      if (!toTeam) {
        return NextResponse.json({ error: 'Echipa destinatie nu exista' }, { status: 400 })
      }
    }

    // Run everything in a transaction
    const now = new Date()
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update child's teamId
      const updated = await tx.child.update({
        where: { id: childId },
        data: { teamId: parsedToTeamId },
        include: {
          team: { select: { id: true, grupa: true } },
          parent: { select: { id: true, name: true, email: true } },
        },
      })

      // 2. Update future attendances to new team
      await tx.attendance.updateMany({
        where: {
          childId,
          date: { gte: now },
        },
        data: { teamId: parsedToTeamId },
      })

      // 3. Create transfer log (only if both teams exist)
      let transferLog = null
      if (fromTeamId !== null && parsedToTeamId !== null) {
        transferLog = await tx.transferLog.create({
          data: {
            childId,
            fromTeamId,
            toTeamId: parsedToTeamId,
            reason: reason || null,
            movedBy: 'admin',
          },
          include: {
            fromTeam: { select: { grupa: true } },
            toTeam: { select: { grupa: true } },
          },
        })
      }

      return { updated, transferLog }
    })

    // Send email notification to parent (non-blocking)
    let emailSent = false
    if (child.parent?.email) {
      const fromName = child.team?.grupa || 'Neasignati'
      const toName = toTeam?.grupa || 'Neasignati'
      const parentName = child.parent.name

      try {
        await transporter.sendMail({
          from: '"Dinamo Rugby Juniori" <noreply@dinamorugby.ro>',
          to: child.parent.email,
          subject: `${child.name} a fost mutat la ${toName}`,
          text: `Salut ${parentName},\n\nTe informam ca ${child.name} a fost mutat de la echipa ${fromName} la echipa ${toName}.\n\n${reason ? `Motiv: ${reason}\n\n` : ''}Daca ai intrebari, contacteaza antrenorul echipei.\n\n— Echipa Dinamo Rugby Juniori`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; padding: 20px 0;">
                <h2 style="color: #1e3a5f; margin: 0;">Dinamo Rugby Juniori</h2>
                <p style="color: #666; margin: 5px 0 0;">Notificare Transfer</p>
              </div>
              <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
                <p style="margin: 0 0 15px;">Salut <strong>${parentName}</strong>,</p>
                <p style="margin: 0 0 15px;">Te informam ca <strong>${child.name}</strong> a fost mutat:</p>
                <div style="background: white; border-radius: 8px; padding: 20px; margin: 0 0 20px; border: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px; color: #6b7280;">De la:</p>
                  <p style="margin: 0 0 15px; font-size: 18px; font-weight: bold; color: #DC2626;">${fromName}</p>
                  <p style="margin: 0 0 8px; color: #6b7280;">La:</p>
                  <p style="margin: 0; font-size: 18px; font-weight: bold; color: #16a34a;">${toName}</p>
                </div>
                ${reason ? `<p style="margin: 0 0 15px;"><strong>Motiv:</strong> ${reason}</p>` : ''}
                <p style="color: #666; font-size: 13px; margin: 0;">Daca ai intrebari, contacteaza antrenorul echipei.</p>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center;">
                Acest email a fost trimis automat de sistemul Dinamo Rugby Juniori.
              </p>
            </div>
          `,
        })
        emailSent = true
      } catch (emailError) {
        console.error('Error sending transfer email:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      child: {
        id: result.updated.id,
        name: result.updated.name,
        birthYear: result.updated.birthYear,
        teamId: result.updated.teamId,
        teamName: result.updated.team?.grupa ?? null,
        parentName: result.updated.parent.name,
        parentEmail: result.updated.parent.email,
      },
      transferLog: result.transferLog,
      emailSent,
    })
  } catch (error) {
    console.error('Error transferring child:', error)
    return NextResponse.json({ error: 'Eroare la transferul sportivului' }, { status: 500 })
  }
}
