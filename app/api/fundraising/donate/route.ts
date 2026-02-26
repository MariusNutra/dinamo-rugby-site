import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
})

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = await checkRateLimit(ip, {
    action: 'donation_form',
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,
  })

  if (!limit.allowed) {
    return NextResponse.json({ error: 'Prea multe cereri. Reincercati mai tarziu.' }, { status: 429 })
  }

  const body = await req.json()
  const { campaignId, donorName, email, amount, message, anonymous } = body

  if (!campaignId || !amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'Campania si suma sunt obligatorii' }, { status: 400 })
  }

  if (amount > 100000) {
    return NextResponse.json({ error: 'Suma depaseste limita permisa' }, { status: 400 })
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
  if (!campaign || !campaign.active) {
    return NextResponse.json({ error: 'Campania nu este activa' }, { status: 404 })
  }

  const donation = await prisma.donation.create({
    data: {
      campaignId,
      donorName: donorName ? String(donorName).slice(0, 200) : null,
      email: email ? String(email).slice(0, 200) : null,
      amount,
      anonymous: anonymous ?? false,
      paymentMethod: 'manual',
      status: 'completed',
    },
  })

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { currentAmount: { increment: amount } },
  })

  // Email confirmation to donor
  if (email) {
    try {
      await transporter.sendMail({
        from: '"Dinamo Rugby Juniori" <contact@dinamorugby.ro>',
        to: email,
        subject: `Confirmare donatie - ${campaign.title}`,
        html: `
          <h2>Multumim pentru donatia ta!</h2>
          <p>Am inregistrat donatia ta de <strong>${amount.toLocaleString('ro-RO')} RON</strong> pentru campania <strong>${escapeHtml(campaign.title)}</strong>.</p>
          ${message ? `<p><strong>Mesajul tau:</strong> ${escapeHtml(message)}</p>` : ''}
          <p>Donatia ta face diferenta pentru juniorii nostri!</p>
          <hr />
          <p style="color: #888; font-size: 12px;">Dinamo Rugby Juniori - dinamorugby.ro</p>
        `,
      })
    } catch (e) {
      console.error('Donation confirmation email error:', e)
    }
  }

  // Notify admin
  try {
    await transporter.sendMail({
      from: '"Fundraising dinamorugby.ro" <contact@dinamorugby.ro>',
      to: 'contact@dinamorugby.ro',
      subject: `Donatie noua: ${amount} RON - ${campaign.title}`,
      html: `
        <h2>Donatie noua primita</h2>
        <p><strong>Campanie:</strong> ${escapeHtml(campaign.title)}</p>
        <p><strong>Suma:</strong> ${amount.toLocaleString('ro-RO')} RON</p>
        <p><strong>Donator:</strong> ${anonymous ? 'Anonim' : escapeHtml(donorName || 'Nespecificat')}</p>
        ${email ? `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` : ''}
        ${message ? `<p><strong>Mesaj:</strong> ${escapeHtml(message)}</p>` : ''}
        <hr />
        <p><a href="https://dinamorugby.ro/admin/fundraising">Vezi in admin</a></p>
      `,
    })
  } catch (e) {
    console.error('Donation admin notification email error:', e)
  }

  return NextResponse.json({ success: true, donationId: donation.id }, { status: 201 })
}
