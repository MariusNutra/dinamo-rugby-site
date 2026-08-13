import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { salveazaImaginePrivata } from '@/lib/upload-privat'

/**
 * Primeste acordul de imagine dintr-un formular PUBLIC (linkul dat pe WhatsApp).
 *
 * Public inseamna ca oricine are adresa poate trimite, deci fiecare camp e
 * tratat ca venind de la un necunoscut:
 *
 *  - limita de trimiteri per IP, ca sa nu se poata umple baza dintr-un script;
 *  - numar maxim de copii intr-o declaratie, altfel un singur mesaj poate cere
 *    mii de fisiere;
 *  - pozele trec prin sharp, care le si redimensioneaza si, mai important,
 *    refuza ce nu e imagine — un fisier redenumit .jpg nu ajunge pe disc;
 *  - pozele se salveaza intr-un dosar PRIVAT, nu in `uploads/`;
 *  - nu se scrie NIMIC in Parent/Child. Un formular deschis care creeaza
 *    conturi si copii in CRM inseamna dubluri si randuri neverificate.
 */

const MAX_COPII = 6
const MAX_POZA_OCTETI = 6 * 1024 * 1024
const AN_MIN = 2005
const AN_MAX = new Date().getFullYear()

type CopilIntrare = {
  nume?: unknown
  anNastere?: unknown
  grupa?: unknown
  telefon?: unknown
  email?: unknown
  poza?: unknown
}

function textCurat(v: unknown, maxim: number): string {
  return typeof v === 'string' ? v.trim().slice(0, maxim) : ''
}

function emailValid(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
}

function telefonValid(v: string): boolean {
  const cifre = v.replace(/[\s.\-()]/g, '')
  return /^(\+4)?0[237]\d{8}$/.test(cifre)
}

/** Scoate octetii dintr-un data URL de imagine. Returneaza null daca nu e imagine. */
function decodeazaPoza(dataUrl: string): { buffer: Buffer; ext: string } | null {
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!m) return null
  const buffer = Buffer.from(m[2], 'base64')
  if (buffer.length === 0 || buffer.length > MAX_POZA_OCTETI) return null
  return { buffer, ext: m[1] }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  const limita = await checkRateLimit(ip, {
    action: 'acord-foto',
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,
  })
  if (!limita.allowed) {
    return NextResponse.json(
      { error: 'Prea multe trimiteri. Te rugam sa incerci peste cateva minute.' },
      { status: 429 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cerere invalida' }, { status: 400 })
  }

  // Capcana pentru roboti: campul e ascuns vizual, deci un om nu-l completeaza
  // niciodata. Raspundem cu succes ca sa nu invete ca au fost prinsi.
  if (textCurat(body.website, 100)) {
    return NextResponse.json({ success: true })
  }

  const parinteNume = textCurat(body.parinteNume, 120)
  const parinteTelefon = textCurat(body.parinteTelefon, 30)
  const parinteEmail = textCurat(body.parinteEmail, 160).toLowerCase()
  const semnatura = typeof body.semnatura === 'string' ? body.semnatura : ''

  if (parinteNume.length < 3) {
    return NextResponse.json({ error: 'Numele parintelui este obligatoriu.' }, { status: 400 })
  }
  if (!telefonValid(parinteTelefon)) {
    return NextResponse.json({ error: 'Numarul de telefon al parintelui nu pare corect.' }, { status: 400 })
  }
  if (!emailValid(parinteEmail)) {
    return NextResponse.json({ error: 'Adresa de email a parintelui nu pare corecta.' }, { status: 400 })
  }
  if (!/^data:image\/png;base64,/.test(semnatura) || semnatura.length > 400_000) {
    return NextResponse.json({ error: 'Semnatura lipseste.' }, { status: 400 })
  }

  const copiiIntrare = Array.isArray(body.copii) ? (body.copii as CopilIntrare[]) : []
  if (copiiIntrare.length === 0) {
    return NextResponse.json({ error: 'Adauga cel putin un copil.' }, { status: 400 })
  }
  if (copiiIntrare.length > MAX_COPII) {
    return NextResponse.json({ error: `Cel mult ${MAX_COPII} copii intr-o declaratie.` }, { status: 400 })
  }

  const copiiCurati: {
    nume: string
    anNastere: number
    grupa: string
    telefon: string | null
    email: string | null
    poza: string | null
  }[] = []

  for (const [i, c] of copiiIntrare.entries()) {
    const nume = textCurat(c.nume, 120)
    const an = Number(c.anNastere)
    const grupa = textCurat(c.grupa, 40)
    const telefon = textCurat(c.telefon, 30)
    const email = textCurat(c.email, 160).toLowerCase()

    if (nume.length < 3) {
      return NextResponse.json({ error: `Numele copilului ${i + 1} este obligatoriu.` }, { status: 400 })
    }
    if (!Number.isInteger(an) || an < AN_MIN || an > AN_MAX) {
      return NextResponse.json(
        { error: `Anul nasterii pentru ${nume} trebuie sa fie intre ${AN_MIN} si ${AN_MAX}.` },
        { status: 400 }
      )
    }
    if (!grupa) {
      return NextResponse.json({ error: `Alege grupa pentru ${nume}.` }, { status: 400 })
    }
    if (telefon && !telefonValid(telefon)) {
      return NextResponse.json({ error: `Telefonul copilului ${nume} nu pare corect.` }, { status: 400 })
    }
    if (email && !emailValid(email)) {
      return NextResponse.json({ error: `Emailul copilului ${nume} nu pare corect.` }, { status: 400 })
    }

    let pozaUrl: string | null = null
    if (typeof c.poza === 'string' && c.poza.startsWith('data:image/')) {
      const decodat = decodeazaPoza(c.poza)
      if (!decodat) {
        return NextResponse.json(
          { error: `Poza pentru ${nume} nu a putut fi citita. Incearca alta imagine (JPG sau PNG, sub 6 MB).` },
          { status: 400 }
        )
      }
      try {
        // Se pastreaza doar numele fisierului. Poza NU intra in `uploads/`,
        // care e servit public de nginx: e o poza de copil, data pentru
        // evidenta clubului, nu pentru publicare.
        pozaUrl = await salveazaImaginePrivata(decodat.buffer, 'acorduri')
      } catch {
        return NextResponse.json(
          { error: `Poza pentru ${nume} nu a putut fi salvata. Incearca alta imagine.` },
          { status: 400 }
        )
      }
    }

    copiiCurati.push({
      nume,
      anNastere: an,
      grupa,
      telefon: telefon || null,
      email: email || null,
      poza: pozaUrl,
    })
  }

  const acord = await prisma.acordFoto.create({
    data: {
      parinteNume,
      parinteTelefon,
      parinteEmail,
      consimtSite: body.consimtSite === true,
      consimtWhatsApp: body.consimtWhatsApp === true,
      semnatura,
      ip,
      userAgent: (req.headers.get('user-agent') || '').slice(0, 300),
      copii: {
        create: copiiCurati.map((c) => ({
          nume: c.nume,
          anNastere: c.anNastere,
          grupa: c.grupa,
          telefon: c.telefon,
          email: c.email,
          pozaUrl: c.poza,
        })),
      },
    },
    select: { id: true },
  })

  return NextResponse.json({ success: true, id: acord.id })
}
