/**
 * Invitatia in Portalul Parintilor.
 *
 * Un cont de parinte se naste FARA parola, indiferent daca a fost creat de mana,
 * dintr-un acord foto sau prin aprobarea unei cereri de acces. Pana nu-si alege
 * o parola, pagina /parinti (care porneste pe formularul de parola) nu-i foloseste
 * la nimic — de aceea invitatia duce direct la /reset-password, nu la portal.
 *
 * Foloseste acelasi camp `token` + `tokenExpiry` ca resetarea de parola, ca sa
 * existe o singura cale de verificat, nu doua.
 */

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dinamorugby.ro'

// Invitatia tine 7 zile, nu o ora ca resetarea: parintele o citeste cand apuca.
const INVITATIE_VALABILA_MS = 7 * 24 * 60 * 60 * 1000

export interface CopilInvitatie {
  name: string
  birthYear: number
  team?: { grupa: string } | null
}

export interface ParinteInvitatie {
  id: string
  name: string
  email: string
  password?: string | null
}

function listaCopii(copii: CopilInvitatie[]) {
  return {
    html: copii
      .map(c => `<li>${c.name} (${c.birthYear})${c.team ? ` — ${c.team.grupa}` : ''}</li>`)
      .join(''),
    text: copii
      .map(c => `- ${c.name} (${c.birthYear})${c.team ? ` — ${c.team.grupa}` : ''}`)
      .join('\n'),
  }
}

function corpHtml(opts: {
  nume: string
  email: string
  intro: string
  copiiHtml: string
  actiune: { url: string; eticheta: string }
  subsol: string
  culoareFundal: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; padding: 20px 0;">
        <h2 style="color: #1e3a5f; margin: 0;">Dinamo Rugby Juniori</h2>
        <p style="color: #666; margin: 5px 0 0;">Portal Parinti</p>
      </div>
      <div style="background: ${opts.culoareFundal}; border-radius: 8px; padding: 30px; margin: 20px 0;">
        <p style="margin: 0 0 15px;">Salut <strong>${opts.nume}</strong>,</p>
        ${opts.intro}
        ${opts.copiiHtml ? `<p style="margin: 0 0 10px;">Copii inregistrati:</p><ul style="margin: 0 0 20px; padding-left: 20px;">${opts.copiiHtml}</ul>` : ''}
        <p style="text-align: center; margin: 25px 0;">
          <a href="${opts.actiune.url}" style="background: #DC2626; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            ${opts.actiune.eticheta}
          </a>
        </p>
        ${opts.subsol}
      </div>
      <p style="color: #999; font-size: 12px; text-align: center;">
        Acest email a fost trimis de echipa Dinamo Rugby Juniori.
      </p>
    </div>
  `
}

/**
 * Trimite invitatia cu link de setare a parolei. Intoarce `false` daca mailul
 * n-a plecat, ca apelantul sa nu raporteze o trimitere care nu s-a intamplat.
 */
export async function trimiteInvitatieParinte(
  parinte: ParinteInvitatie,
  copii: CopilInvitatie[],
  context: { aprobareCerere?: boolean } = {}
): Promise<boolean> {
  const token = crypto.randomBytes(32).toString('hex')
  await prisma.parent.update({
    where: { id: parinte.id },
    data: { token, tokenExpiry: new Date(Date.now() + INVITATIE_VALABILA_MS) },
  })

  const link = `${SITE_URL}/reset-password?token=${token}&type=parent`
  const { html: copiiHtml, text: copiiText } = listaCopii(copii)
  const gazda = SITE_URL.replace(/^https?:\/\//, '')

  const intro = context.aprobareCerere
    ? '<p style="margin: 0 0 15px; color: #16a34a; font-weight: bold;">Cererea ta de acces a fost aprobata!</p><p style="margin: 0 0 15px;">Mai ai un singur pas: iti alegi o parola.</p>'
    : '<p style="margin: 0 0 15px;">Ti-am pregatit contul in Portalul Parintilor. Mai ai un singur pas: iti alegi o parola.</p>'

  const introText = context.aprobareCerere
    ? 'Cererea ta de acces la Portalul Parintilor a fost aprobata! Mai ai un singur pas: iti alegi o parola.'
    : 'Ti-am pregatit contul in Portalul Parintilor. Mai ai un singur pas: iti alegi o parola.'

  return sendEmail({
    to: parinte.email,
    subject: context.aprobareCerere
      ? 'Cererea ta a fost aprobata — Dinamo Rugby Juniori'
      : 'Contul tau in Portalul Parinti — Dinamo Rugby Juniori',
    text: `Salut ${parinte.name},\n\n${introText}\n\n${copiiText ? `Copii inregistrati:\n${copiiText}\n\n` : ''}Alege-ti parola aici:\n${link}\n\nDupa aceea intri oricand de la ${SITE_URL}/parinti, cu adresa ${parinte.email}.\nLinkul e valabil 7 zile; daca expira, foloseste „Am uitat parola" pe pagina de conectare.\n\n— Echipa Dinamo Rugby Juniori`,
    html: corpHtml({
      nume: parinte.name,
      email: parinte.email,
      intro,
      copiiHtml,
      actiune: { url: link, eticheta: 'Alege-ti parola' },
      subsol: `<p style="color: #666; font-size: 13px; margin: 0 0 10px;">Dupa ce ai parola, intri oricand de la <a href="${SITE_URL}/parinti" style="color: #DC2626;">${gazda}/parinti</a>, cu adresa <strong>${parinte.email}</strong>.</p>
               <p style="color: #666; font-size: 13px; margin: 0;">Linkul e valabil 7 zile. Daca expira, foloseste „Am uitat parola" pe pagina de conectare si primesti altul.</p>`,
      culoareFundal: context.aprobareCerere ? '#f0fdf4' : '#f9fafb',
    }),
  })
}

/**
 * Varianta pentru parintele care ARE deja parola: il anuntam ca s-a aprobat
 * cererea, fara sa-i trimitem link de parola noua (ar fi derutant si inutil).
 */
export async function anuntaAprobareParinteCuParola(
  parinte: ParinteInvitatie,
  copii: CopilInvitatie[]
): Promise<boolean> {
  const { html: copiiHtml, text: copiiText } = listaCopii(copii)
  const gazda = SITE_URL.replace(/^https?:\/\//, '')

  return sendEmail({
    to: parinte.email,
    subject: 'Cererea ta a fost aprobata — Dinamo Rugby Juniori',
    text: `Salut ${parinte.name},\n\nCererea ta de acces la Portalul Parintilor a fost aprobata!\n\n${copiiText ? `Copii inregistrati:\n${copiiText}\n\n` : ''}Intri ca de obicei de la ${SITE_URL}/parinti, cu adresa ${parinte.email} si parola ta.\n\n— Echipa Dinamo Rugby Juniori`,
    html: corpHtml({
      nume: parinte.name,
      email: parinte.email,
      intro: '<p style="margin: 0 0 15px; color: #16a34a; font-weight: bold;">Cererea ta de acces a fost aprobata!</p>',
      copiiHtml,
      actiune: { url: `${SITE_URL}/parinti`, eticheta: 'Intra in portal' },
      subsol: `<p style="color: #666; font-size: 13px; margin: 0;">Intri cu adresa <strong>${parinte.email}</strong> si parola ta obisnuita de pe <a href="${SITE_URL}/parinti" style="color: #DC2626;">${gazda}/parinti</a>.</p>`,
      culoareFundal: '#f0fdf4',
    }),
  })
}
