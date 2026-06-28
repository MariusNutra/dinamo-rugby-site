import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  const limit = await checkRateLimit(ip, {
    action: 'forgot_password',
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  })

  if (!limit.allowed) {
    // Still return success for anti-enumeration
    return NextResponse.json({ success: true })
  }

  let email: string
  try {
    const body = await req.json()
    email = body.email
  } catch {
    return NextResponse.json({ success: true })
  }

  if (!email) {
    return NextResponse.json({ success: true })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  try {
    // Search in Parent
    const parent = await prisma.parent.findUnique({ where: { email: normalizedEmail } })
    if (parent) {
      await prisma.parent.update({
        where: { id: parent.id },
        data: { token: resetToken, tokenExpiry: resetTokenExpiry },
      })

      const resetUrl = `https://dinamorugby.ro/reset-password?token=${resetToken}&type=parent`
      await sendEmail({
        to: normalizedEmail,
        subject: 'Resetare parolă — CS Dinamo Rugby',
        html: resetPasswordEmailHtml(parent.name, resetUrl),
      })

      return NextResponse.json({ success: true })
    }

    // Search in Coach
    const coach = await prisma.coach.findFirst({ where: { email: normalizedEmail } })
    if (coach) {
      await prisma.coach.update({
        where: { id: coach.id },
        data: { resetToken, resetTokenExpiry },
      })

      const resetUrl = `https://dinamorugby.ro/reset-password?token=${resetToken}&type=coach`
      await sendEmail({
        to: normalizedEmail,
        subject: 'Resetare parolă — CS Dinamo Rugby',
        html: resetPasswordEmailHtml(coach.name, resetUrl),
      })

      return NextResponse.json({ success: true })
    }

    // Search in User (admin)
    const user = await prisma.user.findFirst({ where: { email: normalizedEmail, active: true } })
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      })

      const resetUrl = `https://dinamorugby.ro/reset-password?token=${resetToken}&type=admin`
      await sendEmail({
        to: normalizedEmail,
        subject: 'Resetare parolă — CS Dinamo Rugby',
        html: resetPasswordEmailHtml(user.name, resetUrl),
      })

      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('[forgot-password] Error:', error)
  }

  // Always return success (anti-enumeration)
  return NextResponse.json({ success: true })
}

function resetPasswordEmailHtml(name: string, resetUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #C8102E; margin: 0;">CS Dinamo București Rugby</h1>
      </div>
      <h2 style="color: #333;">Resetare parolă</h2>
      <p>Salut ${name},</p>
      <p>Am primit o cerere de resetare a parolei pentru contul tău. Apasă butonul de mai jos pentru a seta o parolă nouă:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="background-color: #C8102E; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Resetează parola
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">Acest link expiră în 1 oră.</p>
      <p style="color: #666; font-size: 14px;">Dacă nu ai cerut resetarea parolei, poți ignora acest email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">CS Dinamo București Rugby Juniori</p>
    </div>
  `
}
