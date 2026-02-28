/**
 * Individual email template functions for CS Dinamo București Rugby.
 *
 * Each function returns the full HTML email (already wrapped in the base template).
 * All text is in Romanian.
 */

import { wrapInTemplate, COLOR_BLUE, COLOR_RED, COLOR_TEXT, COLOR_TEXT_LIGHT, COLOR_TEXT_MUTED, COLOR_BORDER, COLOR_WHITE } from './base'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a red CTA button (table-based for email client compatibility) */
function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px auto;">
  <tr>
    <td align="center" style="border-radius: 6px; background-color: ${COLOR_RED};">
      <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: bold; color: ${COLOR_WHITE}; text-decoration: none; border-radius: 6px; background-color: ${COLOR_RED}; mso-padding-alt: 0;">
        <!--[if mso]><i style="letter-spacing: 36px; mso-font-width: -100%; mso-text-raise: 21pt;">&nbsp;</i><![endif]-->
        <span style="mso-text-raise: 10pt;">${text}</span>
        <!--[if mso]><i style="letter-spacing: 36px; mso-font-width: -100%;">&nbsp;</i><![endif]-->
      </a>
    </td>
  </tr>
</table>`
}

/** Section heading */
function heading(text: string): string {
  return `<h2 style="margin: 0 0 20px; font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: bold; color: ${COLOR_BLUE}; line-height: 1.3;">${text}</h2>`
}

/** Paragraph text */
function paragraph(text: string): string {
  return `<p style="margin: 0 0 16px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6; color: ${COLOR_TEXT};">${text}</p>`
}

/** Muted small text */
function muted(text: string): string {
  return `<p style="margin: 0 0 12px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.5; color: ${COLOR_TEXT_MUTED};">${text}</p>`
}

/** Horizontal divider */
function divider(): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
  <tr><td style="border-top: 1px solid ${COLOR_BORDER}; font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
</table>`
}

// ---------------------------------------------------------------------------
// Template: Magic Link Email
// ---------------------------------------------------------------------------

interface MagicLinkParams {
  name: string
  loginUrl: string
}

export function magicLinkEmail(params: MagicLinkParams): string {
  const { name, loginUrl } = params

  const content = `
${heading('Conectare Portal Parinti')}
${paragraph(`Salut <strong>${name}</strong>,`)}
${paragraph('Ai solicitat un link de conectare la Portalul Parintilor CS Dinamo Bucuresti Rugby. Apasa butonul de mai jos pentru a accesa contul tau:')}
${ctaButton('Acceseaza contul', loginUrl)}
${paragraph('Daca butonul nu functioneaza, copiaza si lipeste urmatorul link in browserul tau:')}
<p style="margin: 0 0 16px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.5; color: ${COLOR_TEXT_LIGHT}; word-break: break-all;">
  <a href="${loginUrl}" style="color: ${COLOR_TEXT_LIGHT}; text-decoration: underline;">${loginUrl}</a>
</p>
${divider()}
${muted('Acest link este valabil 15 minute. Dupa expirare, va trebui sa soliciti un nou link de conectare.')}
${muted('Daca nu ai solicitat acest link, ignora acest email. Contul tau este in siguranta.')}
`

  return wrapInTemplate(content, {
    preheader: 'Linkul tau de conectare la Portalul Parintilor',
  })
}

// ---------------------------------------------------------------------------
// Template: General Notification Email
// ---------------------------------------------------------------------------

interface NotificationParams {
  title: string
  body: string
  ctaUrl?: string
  ctaText?: string
}

export function notificationEmail(params: NotificationParams): string {
  const { title, body, ctaUrl, ctaText } = params

  let content = `
${heading(title)}
<div style="margin: 0 0 16px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6; color: ${COLOR_TEXT};">
  ${body}
</div>
`

  if (ctaUrl && ctaText) {
    content += ctaButton(ctaText, ctaUrl)
  }

  return wrapInTemplate(content, {
    preheader: title,
  })
}

// ---------------------------------------------------------------------------
// Template: Payment Receipt Email
// ---------------------------------------------------------------------------

interface PaymentReceiptParams {
  parentName: string
  childName: string
  amount: number
  description: string
  date: string
  receiptNumber?: string
}

export function paymentReceiptEmail(params: PaymentReceiptParams): string {
  const { parentName, childName, amount, description, date, receiptNumber } = params

  const formattedAmount = `${amount.toFixed(2)} RON`

  const receiptRow = receiptNumber
    ? `<tr>
        <td style="padding: 10px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${COLOR_TEXT_LIGHT}; border-bottom: 1px solid ${COLOR_BORDER};">Numar chitanta</td>
        <td style="padding: 10px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${COLOR_TEXT}; font-weight: bold; border-bottom: 1px solid ${COLOR_BORDER}; text-align: right;">${receiptNumber}</td>
      </tr>`
    : ''

  const content = `
${heading('Confirmare plata')}
${paragraph(`Stimate/a <strong>${parentName}</strong>,`)}
${paragraph('Va confirmam ca plata dumneavoastra a fost inregistrata cu succes. Mai jos gasiti detaliile tranzactiei:')}

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid ${COLOR_BORDER}; border-radius: 6px; border-collapse: separate;">
  <tr style="background-color: #f9fafb;">
    <td style="padding: 10px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${COLOR_TEXT_LIGHT}; border-bottom: 1px solid ${COLOR_BORDER};">Descriere</td>
    <td style="padding: 10px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${COLOR_TEXT}; font-weight: bold; border-bottom: 1px solid ${COLOR_BORDER}; text-align: right;">${description}</td>
  </tr>
  <tr>
    <td style="padding: 10px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${COLOR_TEXT_LIGHT}; border-bottom: 1px solid ${COLOR_BORDER};">Sportiv</td>
    <td style="padding: 10px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${COLOR_TEXT}; font-weight: bold; border-bottom: 1px solid ${COLOR_BORDER}; text-align: right;">${childName}</td>
  </tr>
  <tr style="background-color: #f9fafb;">
    <td style="padding: 10px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${COLOR_TEXT_LIGHT}; border-bottom: 1px solid ${COLOR_BORDER};">Data</td>
    <td style="padding: 10px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${COLOR_TEXT}; font-weight: bold; border-bottom: 1px solid ${COLOR_BORDER}; text-align: right;">${date}</td>
  </tr>
  ${receiptRow}
  <tr style="background-color: ${COLOR_BLUE};">
    <td style="padding: 12px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: ${COLOR_WHITE}; font-weight: bold; border-radius: 0 0 0 6px;">Suma platita</td>
    <td style="padding: 12px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: ${COLOR_WHITE}; font-weight: bold; text-align: right; border-radius: 0 0 6px 0;">${formattedAmount}</td>
  </tr>
</table>

${divider()}
${paragraph('Va multumim pentru sprijinul acordat! Plata dumneavoastra contribuie la dezvoltarea sportivilor nostri.')}
${muted('Acesta este un email generat automat. Pentru intrebari legate de plati, contactati-ne la <a href="mailto:contact@dinamorugby.ro" style="color: ' + COLOR_TEXT_MUTED + '; text-decoration: underline;">contact@dinamorugby.ro</a>.')}
`

  return wrapInTemplate(content, {
    preheader: `Confirmare plata ${formattedAmount} - ${description}`,
  })
}

// ---------------------------------------------------------------------------
// Template: Welcome Email
// ---------------------------------------------------------------------------

interface WelcomeParams {
  parentName: string
  childName: string
  teamName: string
  loginUrl: string
}

export function welcomeEmail(params: WelcomeParams): string {
  const { parentName, childName, teamName, loginUrl } = params

  const content = `
${heading('Bine ati venit la CS Dinamo Bucuresti Rugby!')}
${paragraph(`Stimate/a <strong>${parentName}</strong>,`)}
${paragraph(`Felicitari! <strong>${childName}</strong> a fost inregistrat/a cu succes in cadrul clubului nostru si a fost repartizat/a la echipa <strong>${teamName}</strong>.`)}
${paragraph('Suntem incantati sa il/o avem alaturi de noi si abia asteptam sa incepem aceasta aventura impreuna!')}

${divider()}

<h3 style="margin: 0 0 14px; font-family: Arial, Helvetica, sans-serif; font-size: 17px; font-weight: bold; color: ${COLOR_BLUE};">Urmatorii pasi:</h3>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 10px;">
  <tr>
    <td width="30" valign="top" style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: ${COLOR_RED}; font-weight: bold; padding: 4px 0;">1.</td>
    <td style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.5; color: ${COLOR_TEXT}; padding: 4px 0;">
      <strong>Acceseaza portalul parintilor</strong> pentru a vizualiza programul antrenamentelor, platile si documentele.
    </td>
  </tr>
</table>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 10px;">
  <tr>
    <td width="30" valign="top" style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: ${COLOR_RED}; font-weight: bold; padding: 4px 0;">2.</td>
    <td style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.5; color: ${COLOR_TEXT}; padding: 4px 0;">
      <strong>Completeaza documentele necesare</strong> (fisa medicala, acordul parental) prin portal.
    </td>
  </tr>
</table>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 10px;">
  <tr>
    <td width="30" valign="top" style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: ${COLOR_RED}; font-weight: bold; padding: 4px 0;">3.</td>
    <td style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.5; color: ${COLOR_TEXT}; padding: 4px 0;">
      <strong>Contacteaza antrenorul</strong> echipei pentru detalii despre programul de antrenament si echipament.
    </td>
  </tr>
</table>

${ctaButton('Acceseaza portalul', loginUrl)}

${divider()}
${muted('Pentru orice intrebari, nu ezitati sa ne contactati la <a href="mailto:contact@dinamorugby.ro" style="color: ' + COLOR_TEXT_MUTED + '; text-decoration: underline;">contact@dinamorugby.ro</a> sau prin portalul pentru parinti.')}
`

  return wrapInTemplate(content, {
    preheader: `Bine ati venit! ${childName} a fost inregistrat/a la ${teamName}`,
  })
}

// ---------------------------------------------------------------------------
// Template: Payment Reminder Email
// ---------------------------------------------------------------------------

interface PaymentReminderParams {
  parentName: string
  childName: string
  amount: number
  dueDate: string
  paymentUrl: string
}

export function paymentReminderEmail(params: PaymentReminderParams): string {
  const { parentName, childName, amount, dueDate, paymentUrl } = params

  const formattedAmount = `${amount.toFixed(2)} RON`

  const content = `
${heading('Reminder plata cotizatie')}
${paragraph(`Stimate/a <strong>${parentName}</strong>,`)}
${paragraph(`Va reamintim ca aveti o cotizatie restanta pentru sportivul <strong>${childName}</strong>.`)}

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid ${COLOR_BORDER}; border-radius: 6px; border-collapse: separate; background-color: #fef2f2;">
  <tr>
    <td style="padding: 20px; text-align: center;">
      <p style="margin: 0 0 6px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${COLOR_TEXT_LIGHT};">Suma de plata:</p>
      <p style="margin: 0 0 10px; font-family: Arial, Helvetica, sans-serif; font-size: 28px; font-weight: bold; color: ${COLOR_RED};">${formattedAmount}</p>
      <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${COLOR_TEXT_LIGHT};">Termen de plata: <strong>${dueDate}</strong></p>
    </td>
  </tr>
</table>

${paragraph('Pentru a efectua plata, accesati portalul parintilor folosind butonul de mai jos:')}

${ctaButton('Plateste acum', paymentUrl)}

${divider()}
${paragraph('Daca ati efectuat deja plata, va rugam sa ignorati acest email. Este posibil ca plata sa nu fi fost inca procesata.')}
${muted('Pentru intrebari legate de plati sau daca aveti nevoie de un plan de plata, contactati-ne la <a href="mailto:contact@dinamorugby.ro" style="color: ' + COLOR_TEXT_MUTED + '; text-decoration: underline;">contact@dinamorugby.ro</a> sau la telefon <a href="tel:+40700000000" style="color: ' + COLOR_TEXT_MUTED + '; text-decoration: underline;">0700 000 000</a>.')}
`

  return wrapInTemplate(content, {
    preheader: `Reminder: cotizatie ${formattedAmount} pentru ${childName} - termen ${dueDate}`,
  })
}
