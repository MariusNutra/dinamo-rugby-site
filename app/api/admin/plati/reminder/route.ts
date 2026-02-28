import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
})

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { parentIds } = body

  if (!parentIds || !Array.isArray(parentIds) || parentIds.length === 0) {
    return NextResponse.json({ error: 'Selecteaza cel putin un parinte' }, { status: 400 })
  }

  const parents = await prisma.parent.findMany({
    where: { id: { in: parentIds } },
    include: {
      children: { select: { name: true } },
    },
  })

  let sent = 0
  for (const parent of parents) {
    const childNames = parent.children.map(c => c.name).join(', ')
    try {
      await transporter.sendMail({
        from: '"CS Dinamo București Rugby" <contact@dinamorugby.ro>',
        to: parent.email,
        subject: 'Reminder cotizatie - CS Dinamo București Rugby',
        text: `Stimate/a ${parent.name},\n\nVa reamintim ca aveti o cotizatie restanta pentru: ${childNames}.\n\nPuteti efectua plata prin portalul pentru parinti.\n\nVa multumim!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1e3a5f; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px;">CS Dinamo București Rugby</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #1e3a5f; margin-top: 0;">Reminder cotizatie</h2>
              <p>Stimate/a <strong>${parent.name}</strong>,</p>
              <p>Va reamintim ca aveti o cotizatie restanta pentru: <strong>${childNames}</strong>.</p>
              <p>Puteti efectua plata prin portalul pentru parinti accesand link-ul de mai jos:</p>
              <p style="text-align: center; margin: 25px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://dinamorugby.ro'}/parinti"
                   style="background-color: #c62828; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Plateste cotizatia
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">Va multumim pentru sprijin!</p>
            </div>
            <div style="padding: 15px; text-align: center; color: #999; font-size: 12px;">
              CS Dinamo București Rugby - Sectia Juniori
            </div>
          </div>
        `,
      })
      sent++
    } catch (err) {
      console.error(`Failed to send reminder to ${parent.email}:`, err)
    }
  }

  return NextResponse.json({ success: true, sent })
}
