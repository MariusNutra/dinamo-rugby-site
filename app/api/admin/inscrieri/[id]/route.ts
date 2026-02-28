import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { randomBytes } from 'crypto'

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dinamorugby.ro'

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function emailWrapper(content: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; padding: 20px 0; background: #1e3a5f; border-radius: 8px 8px 0 0;">
        <h2 style="color: #ffffff; margin: 0;">CS Dinamo București Rugby</h2>
      </div>
      <div style="background: #ffffff; border-radius: 0 0 8px 8px; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        ${content}
      </div>
      <div style="padding: 15px; text-align: center; color: #999; font-size: 12px;">
        <p style="margin: 0;">CS Dinamo București Rugby &mdash; dinamorugby.ro</p>
        <p style="margin: 5px 0 0;">Contact: contact@dinamorugby.ro</p>
      </div>
    </div>
  `
}

const DAY_MAP: Record<string, string> = {
  luni: 'Luni', marti: 'Marti', miercuri: 'Miercuri', joi: 'Joi',
  vineri: 'Vineri', sambata: 'Sambata', duminica: 'Duminica',
  Luni: 'Luni', Marti: 'Marti', Miercuri: 'Miercuri', Joi: 'Joi',
  Vineri: 'Vineri', Sambata: 'Sambata', Duminica: 'Duminica',
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const { id } = await params

  try {
    const body = await req.json()
    const { status, notes, rejectionReason, teamId } = body

    const validStatuses = ['noua', 'contactata', 'acceptata', 'respinsa']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status invalid' }, { status: 400 })
    }

    // Fetch existing registration
    const existing = await prisma.registration.findUnique({
      where: { id },
      include: { team: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Inscrierea nu a fost gasita' }, { status: 404 })
    }

    const childFullName = `${existing.childFirstName} ${existing.childLastName}`
    const safeChildName = escapeHtml(childFullName)
    const safeParentName = escapeHtml(existing.parentName)

    // ── STATUS: NOUA ──
    if (status === 'noua') {
      const registration = await prisma.registration.update({
        where: { id },
        data: {
          status: 'noua',
          ...(notes !== undefined && { notes: notes ? String(notes).slice(0, 1000) : null }),
        },
        include: { team: true },
      })
      return NextResponse.json(registration)
    }

    // ── STATUS: CONTACTATA ──
    if (status === 'contactata') {
      const registration = await prisma.registration.update({
        where: { id },
        data: {
          status: 'contactata',
          ...(notes !== undefined && { notes: notes ? String(notes).slice(0, 1000) : null }),
        },
        include: { team: true },
      })

      try {
        await transporter.sendMail({
          from: '"CS Dinamo București Rugby" <contact@dinamorugby.ro>',
          to: existing.email,
          subject: `Am primit cererea de inscriere pentru ${childFullName}`,
          html: emailWrapper(`
            <p style="margin: 0 0 15px;">Salut <strong>${safeParentName}</strong>,</p>
            <p style="margin: 0 0 15px;">Iti confirmam ca am primit cererea de inscriere pentru <strong>${safeChildName}</strong> la CS Dinamo București Rugby.</p>
            <p style="margin: 0 0 15px;">Cererea ta este in curs de procesare si vom lua legatura telefonic pentru a discuta detaliile inscrierii.</p>
            <p style="margin: 0 0 15px;">Daca ai intrebari intre timp, nu ezita sa ne contactezi la <a href="mailto:contact@dinamorugby.ro" style="color: #DC2626;">contact@dinamorugby.ro</a>.</p>
            <p style="margin: 0;">Cu respect,<br/><strong>Echipa CS Dinamo București Rugby</strong></p>
          `),
        })
      } catch (emailError) {
        console.error('Error sending contactata email:', emailError)
      }

      return NextResponse.json(registration)
    }

    // ── STATUS: ACCEPTATA ──
    if (status === 'acceptata') {
      const finalTeamId = teamId ? Number(teamId) : existing.teamId

      if (!finalTeamId) {
        return NextResponse.json({ error: 'Trebuie selectata o grupa pentru acceptare' }, { status: 400 })
      }

      // Update registration
      const registration = await prisma.registration.update({
        where: { id },
        data: {
          status: 'acceptata',
          teamId: finalTeamId,
          ...(notes !== undefined && { notes: notes ? String(notes).slice(0, 1000) : null }),
        },
        include: { team: true },
      })

      // Upsert parent + create child
      const parent = await prisma.parent.upsert({
        where: { email: existing.email.toLowerCase().trim() },
        create: {
          name: existing.parentName.trim(),
          email: existing.email.toLowerCase().trim(),
          phone: existing.phone.trim(),
        },
        update: {},
      })

      const child = await prisma.child.create({
        data: {
          name: `${existing.childFirstName.trim()} ${existing.childLastName.trim()}`,
          birthYear: new Date(existing.birthDate).getFullYear(),
          parentId: parent.id,
          teamId: finalTeamId,
        },
      })

      // Generate magic link token
      const token = randomBytes(32).toString('hex')
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await prisma.parent.update({
        where: { id: parent.id },
        data: { token, tokenExpiry },
      })
      const magicLink = `${SITE_URL}/api/parinti/verify?token=${token}`

      // Fetch team, training sessions, coaches
      const team = await prisma.team.findUnique({ where: { id: finalTeamId } })
      const trainingSessions = await prisma.trainingSession.findMany({
        where: { grupa: team?.grupa || '' },
      })
      const coaches = await prisma.coach.findMany({
        where: { teamId: finalTeamId },
        orderBy: { order: 'asc' },
      })

      // Check modulePlati
      const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } })
      const modulePlati = settings?.modulePlati || false

      // Build training schedule HTML
      let scheduleHtml = ''
      if (trainingSessions.length > 0) {
        scheduleHtml = `
          <div style="background: #f0f9ff; border-radius: 6px; padding: 15px; margin: 15px 0;">
            <p style="margin: 0 0 10px; font-weight: bold; color: #1e3a5f;">Program antrenamente:</p>
            ${trainingSessions.map(s => `
              <p style="margin: 0 0 5px;">
                <strong>${DAY_MAP[s.day] || s.day}</strong>: ${s.startTime} - ${s.endTime}
                ${s.location ? ` &mdash; ${escapeHtml(s.location)}` : ''}
              </p>
            `).join('')}
          </div>
        `
      }

      // Build coach info HTML
      let coachHtml = ''
      if (coaches.length > 0) {
        coachHtml = `
          <p style="margin: 15px 0 5px; font-weight: bold; color: #1e3a5f;">Antrenor${coaches.length > 1 ? 'i' : ''}:</p>
          ${coaches.map(c => `<p style="margin: 0 0 5px;">${escapeHtml(c.name)}${c.description ? ` &mdash; ${escapeHtml(c.description)}` : ''}</p>`).join('')}
        `
      }

      // Build payment section
      let paymentHtml = ''
      if (modulePlati) {
        paymentHtml = `
          <p style="margin: 15px 0 5px;">Cotizatia lunara poate fi platita prin Portalul Parintilor. Acceseaza portalul pentru detalii.</p>
        `
      }

      const grupaName = team?.grupa || 'Nedefinita'

      try {
        await transporter.sendMail({
          from: '"CS Dinamo București Rugby" <contact@dinamorugby.ro>',
          to: existing.email,
          subject: `Felicitari! Inscrierea lui ${childFullName} la CS Dinamo București Rugby a fost acceptata!`,
          html: emailWrapper(`
            <p style="margin: 0 0 15px;">Salut <strong>${safeParentName}</strong>,</p>
            <p style="margin: 0 0 15px; color: #16a34a; font-weight: bold; font-size: 18px;">Bun venit in familia Dinamo Rugby!</p>
            <p style="margin: 0 0 15px;">Suntem incantati sa iti comunicam ca inscrierea lui <strong>${safeChildName}</strong> a fost acceptata!</p>

            <div style="background: #f0fdf4; border-radius: 6px; padding: 15px; margin: 15px 0;">
              <p style="margin: 0 0 5px; font-weight: bold; color: #1e3a5f;">Grupa repartizata: ${escapeHtml(grupaName)}</p>
            </div>

            ${scheduleHtml}

            <div style="background: #fffbeb; border-radius: 6px; padding: 15px; margin: 15px 0;">
              <p style="margin: 0 0 10px; font-weight: bold; color: #92400e;">Ce trebuie sa aduceti la antrenament:</p>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>Echipament sport (tricou, pantaloni scurti/trening)</li>
                <li>Ghete adecvate (teren sintetic sau iarba)</li>
                <li>Apa</li>
                <li>Prosop</li>
              </ul>
            </div>

            ${coachHtml}
            ${paymentHtml}

            <p style="text-align: center; margin: 25px 0;">
              <a href="${magicLink}" style="background: #DC2626; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Acceseaza Portalul Parintilor
              </a>
            </p>
            <p style="color: #666; font-size: 13px; margin: 0 0 15px; text-align: center;">Link-ul este valabil 24 de ore. Dupa expirare, poti solicita un nou link din portal.</p>
            <p style="margin: 0;">Cu drag,<br/><strong>Echipa CS Dinamo București Rugby</strong></p>
          `),
        })
      } catch (emailError) {
        console.error('Error sending acceptata email:', emailError)
      }

      return NextResponse.json({ ...registration, childCreated: true, childId: child.id, parentId: parent.id })
    }

    // ── STATUS: RESPINSA ──
    if (status === 'respinsa') {
      const registration = await prisma.registration.update({
        where: { id },
        data: {
          status: 'respinsa',
          rejectionReason: rejectionReason ? String(rejectionReason).slice(0, 1000) : null,
          ...(notes !== undefined && { notes: notes ? String(notes).slice(0, 1000) : null }),
        },
        include: { team: true },
      })

      const reasonHtml = rejectionReason
        ? `<p style="margin: 0 0 15px; background: #fef2f2; padding: 12px; border-radius: 6px; color: #991b1b;"><strong>Motiv:</strong> ${escapeHtml(String(rejectionReason))}</p>`
        : ''

      try {
        await transporter.sendMail({
          from: '"CS Dinamo București Rugby" <contact@dinamorugby.ro>',
          to: existing.email,
          subject: 'Informare privind cererea de inscriere',
          html: emailWrapper(`
            <p style="margin: 0 0 15px;">Salut <strong>${safeParentName}</strong>,</p>
            <p style="margin: 0 0 15px;">Va multumim pentru interesul aratat fata de CS Dinamo București Rugby.</p>
            <p style="margin: 0 0 15px;">Din pacate, cererea de inscriere pentru <strong>${safeChildName}</strong> nu a putut fi acceptata in acest moment.</p>
            ${reasonHtml}
            <p style="margin: 0 0 15px;">Va invitam sa reveniti cu o noua cerere in viitor sau sa ne contactati pentru mai multe informatii.</p>
            <p style="margin: 0;">Cu respect,<br/><strong>Echipa CS Dinamo București Rugby</strong></p>
          `),
        })
      } catch (emailError) {
        console.error('Error sending respinsa email:', emailError)
      }

      return NextResponse.json(registration)
    }

    // Fallback: just update notes
    const registration = await prisma.registration.update({
      where: { id },
      data: {
        ...(notes !== undefined && { notes: notes ? String(notes).slice(0, 1000) : null }),
      },
      include: { team: true },
    })

    return NextResponse.json(registration)
  } catch (error) {
    console.error('Error updating registration:', error)
    return NextResponse.json({ error: 'Eroare la actualizarea inscrierii' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const { id } = await params

  await prisma.registration.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
