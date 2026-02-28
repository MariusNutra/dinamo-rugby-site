/**
 * Centralized email sending for CS Dinamo București Rugby.
 *
 * This module provides:
 * - A shared nodemailer transporter (localhost:25)
 * - A generic `sendEmail` function
 * - Convenience functions for each email template
 *
 * Usage:
 *   import { sendMagicLink, sendNotification, sendPaymentReceipt, sendWelcome, sendPaymentReminder } from '@/lib/email'
 */

import nodemailer from 'nodemailer'
import { magicLinkEmail, notificationEmail, paymentReceiptEmail, welcomeEmail, paymentReminderEmail } from './email-templates/templates'

// ---------------------------------------------------------------------------
// Transporter (shared singleton)
// ---------------------------------------------------------------------------

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
})

const DEFAULT_FROM = 'CS Dinamo Rugby <noreply@dinamorugby.ro>'

// ---------------------------------------------------------------------------
// Generic send
// ---------------------------------------------------------------------------

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
  text?: string
}

/**
 * Send an email via the local SMTP server.
 * Returns `true` on success, `false` on failure. Errors are logged but not thrown.
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const { to, subject, html, from = DEFAULT_FROM, text } = params

  try {
    const info = await transporter.sendMail({
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      ...(text ? { text } : {}),
    })

    console.log(`[email] Sent "${subject}" to ${Array.isArray(to) ? to.join(', ') : to} (messageId: ${info.messageId})`)
    return true
  } catch (error) {
    console.error(`[email] Failed to send "${subject}" to ${Array.isArray(to) ? to.join(', ') : to}:`, error)
    return false
  }
}

// ---------------------------------------------------------------------------
// Convenience: Magic Link
// ---------------------------------------------------------------------------

export async function sendMagicLink(
  to: string,
  name: string,
  loginUrl: string
): Promise<boolean> {
  const html = magicLinkEmail({ name, loginUrl })

  return sendEmail({
    to,
    subject: 'Conectare Portal Parinti — CS Dinamo Rugby',
    html,
  })
}

// ---------------------------------------------------------------------------
// Convenience: General Notification
// ---------------------------------------------------------------------------

export async function sendNotification(
  to: string | string[],
  title: string,
  body: string,
  ctaUrl?: string,
  ctaText?: string
): Promise<boolean> {
  const html = notificationEmail({ title, body, ctaUrl, ctaText })

  return sendEmail({
    to,
    subject: `${title} — CS Dinamo Rugby`,
    html,
  })
}

// ---------------------------------------------------------------------------
// Convenience: Payment Receipt
// ---------------------------------------------------------------------------

interface PaymentReceiptInput {
  parentName: string
  childName: string
  amount: number
  description: string
  date: string
  receiptNumber?: string
}

export async function sendPaymentReceipt(
  to: string,
  params: PaymentReceiptInput
): Promise<boolean> {
  const html = paymentReceiptEmail(params)

  return sendEmail({
    to,
    subject: `Confirmare plata ${params.amount.toFixed(2)} RON — CS Dinamo Rugby`,
    html,
  })
}

// ---------------------------------------------------------------------------
// Convenience: Welcome
// ---------------------------------------------------------------------------

interface WelcomeInput {
  parentName: string
  childName: string
  teamName: string
  loginUrl: string
}

export async function sendWelcome(
  to: string,
  params: WelcomeInput
): Promise<boolean> {
  const html = welcomeEmail(params)

  return sendEmail({
    to,
    subject: `Bine ati venit la CS Dinamo Bucuresti Rugby!`,
    html,
  })
}

// ---------------------------------------------------------------------------
// Convenience: Payment Reminder
// ---------------------------------------------------------------------------

interface PaymentReminderInput {
  parentName: string
  childName: string
  amount: number
  dueDate: string
  paymentUrl: string
}

export async function sendPaymentReminder(
  to: string,
  params: PaymentReminderInput
): Promise<boolean> {
  const html = paymentReminderEmail(params)

  return sendEmail({
    to,
    subject: `Reminder cotizatie ${params.amount.toFixed(2)} RON — CS Dinamo Rugby`,
    html,
  })
}
