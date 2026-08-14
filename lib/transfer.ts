import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

/**
 * Mutarea unui copil dintr-o echipa in alta.
 *
 * Sta separat fiindca acum o cer doua locuri — adminul din `/admin/sportivi` si
 * antrenorul din portalul lui. Regulile trebuie sa fie identice indiferent cine
 * apasa: aceeasi tranzactie, acelasi jurnal, acelasi email catre parinte.
 * Diferenta e doar cine are voie sa ceara mutarea, iar asta se decide in ruta,
 * inainte de a ajunge aici.
 */

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
})

export interface TransferInput {
  childId: string
  /** null = scos din echipa, fara alta destinatie */
  toTeamId: number | null
  reason?: string | null
  /** Cine a facut mutarea: 'admin' sau numele antrenorului. Ajunge in jurnal. */
  movedBy: string
}

export interface TransferLogEntry {
  id: string
  childId: string
  reason: string | null
  createdAt: Date
  fromTeam: { grupa: string }
  toTeam: { grupa: string }
}

export type TransferResult =
  | {
      ok: true
      child: TransferredChild
      emailSent: boolean
      /** null cand copilul a fost doar scos din echipa: jurnalul cere ambele capete. */
      transferLog: TransferLogEntry | null
    }
  | { ok: false; error: string; status: number }

export interface TransferredChild {
  id: string
  name: string
  birthYear: number
  teamId: number | null
  teamName: string | null
  parentName: string
  parentEmail: string | null
}

export async function transferChild(input: TransferInput): Promise<TransferResult> {
  const { childId, toTeamId, reason, movedBy } = input

  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: {
      team: { select: { id: true, grupa: true } },
      parent: { select: { id: true, name: true, email: true } },
    },
  })

  if (!child) {
    return { ok: false, error: 'Sportivul nu a fost gasit', status: 404 }
  }

  const fromTeamId = child.teamId

  if (fromTeamId === toTeamId) {
    return { ok: false, error: 'Sportivul este deja in aceasta echipa', status: 400 }
  }

  let toTeam: { id: number; grupa: string } | null = null
  if (toTeamId !== null) {
    toTeam = await prisma.team.findUnique({
      where: { id: toTeamId },
      select: { id: true, grupa: true },
    })
    if (!toTeam) {
      return { ok: false, error: 'Echipa destinatie nu exista', status: 400 }
    }
  }

  const now = new Date()
  const { child: updated, transferLog } = await prisma.$transaction(async tx => {
    const child = await tx.child.update({
      where: { id: childId },
      data: { teamId: toTeamId },
      include: {
        team: { select: { id: true, grupa: true } },
        parent: { select: { name: true, email: true } },
      },
    })

    // Prezentele deja consemnate raman pe echipa veche — sunt fapte petrecute.
    // Doar cele viitoare se muta odata cu copilul.
    await tx.attendance.updateMany({
      where: { childId, date: { gte: now } },
      data: { teamId: toTeamId },
    })

    // Jurnalul cere ambele capete, deci scoaterea din echipa nu se logheaza aici.
    let transferLog: TransferLogEntry | null = null
    if (fromTeamId !== null && toTeamId !== null) {
      transferLog = await tx.transferLog.create({
        data: { childId, fromTeamId, toTeamId, reason: reason || null, movedBy },
        include: {
          fromTeam: { select: { grupa: true } },
          toTeam: { select: { grupa: true } },
        },
      })
    }

    return { child, transferLog }
  })

  const emailSent = await notifyParent({
    parentName: child.parent?.name ?? '',
    parentEmail: child.parent?.email ?? null,
    childName: child.name,
    fromName: child.team?.grupa || 'Neasignati',
    toName: toTeam?.grupa || 'Neasignati',
    reason: reason || null,
  })

  return {
    ok: true,
    emailSent,
    transferLog,
    child: {
      id: updated.id,
      name: updated.name,
      birthYear: updated.birthYear,
      teamId: updated.teamId,
      teamName: updated.team?.grupa ?? null,
      parentName: updated.parent.name,
      parentEmail: updated.parent.email,
    },
  }
}

interface NotifyInput {
  parentName: string
  parentEmail: string | null
  childName: string
  fromName: string
  toName: string
  reason: string | null
}

/** Anunta parintele. Esecul la trimitere nu anuleaza mutarea, care e deja facuta. */
async function notifyParent(input: NotifyInput): Promise<boolean> {
  if (!input.parentEmail) return false

  const { parentName, childName, fromName, toName, reason } = input

  try {
    await transporter.sendMail({
      from: '"Dinamo Rugby Juniori" <noreply@dinamorugby.ro>',
      to: input.parentEmail,
      subject: `${childName} a fost mutat la ${toName}`,
      text: `Salut ${parentName},\n\nTe informam ca ${childName} a fost mutat de la echipa ${fromName} la echipa ${toName}.\n\n${reason ? `Motiv: ${reason}\n\n` : ''}Daca ai intrebari, contacteaza antrenorul echipei.\n\n— Echipa Dinamo Rugby Juniori`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px 0;">
            <h2 style="color: #1e3a5f; margin: 0;">Dinamo Rugby Juniori</h2>
            <p style="color: #666; margin: 5px 0 0;">Notificare Transfer</p>
          </div>
          <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
            <p style="margin: 0 0 15px;">Salut <strong>${parentName}</strong>,</p>
            <p style="margin: 0 0 15px;">Te informam ca <strong>${childName}</strong> a fost mutat:</p>
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
    return true
  } catch (error) {
    console.error('Eroare la trimiterea emailului de transfer:', error)
    return false
  }
}
