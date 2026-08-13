import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

/**
 * Editarea si stergerea unei intrari din tabelul de acorduri.
 *
 * `[id]` e id-ul COPILULUI, fiindca tabelul are un rand per copil. Datele
 * parintelui stau pe declaratie si sunt comune tuturor copiilor din ea — cine
 * le schimba le schimba pentru toti, si interfata spune asta.
 *
 * Cer `athletes.manage`, nu `athletes.view`: una e sa te uiti la acorduri, alta
 * sa le modifici. Semnatura e dovada ca parintele a declarat ceva anume; cine
 * poate rescrie numele de langa ea schimba intelesul dovezii.
 */

const AN_MIN = 2005
const AN_MAX = new Date().getFullYear()

function textCurat(v: unknown, maxim: number): string {
  return typeof v === 'string' ? v.trim().slice(0, maxim) : ''
}

/** Sterge poza privata a unui copil, daca are. Lipsa fisierului nu e eroare. */
async function stergePoza(numeFisier: string | null) {
  if (!numeFisier || !/^[a-f0-9]{32}\.jpg$/.test(numeFisier)) return
  const cale = path.join(process.cwd(), 'private-uploads', 'acorduri', numeFisier)
  await fs.unlink(cale).catch(() => undefined)
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const authz = await requirePermission('athletes.manage')
  if (authz.error) return authz.error

  const { id } = await props.params
  const copil = await prisma.acordFotoCopil.findUnique({
    where: { id },
    select: { id: true, acordId: true },
  })
  if (!copil) return NextResponse.json({ error: 'Intrarea nu exista' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cerere invalida' }, { status: 400 })
  }

  const nume = textCurat(body.nume, 120)
  const grupa = textCurat(body.grupa, 40)
  const an = Number(body.anNastere)

  if (nume.length < 3) {
    return NextResponse.json({ error: 'Numele copilului este obligatoriu.' }, { status: 400 })
  }
  if (!grupa) {
    return NextResponse.json({ error: 'Grupa este obligatorie.' }, { status: 400 })
  }
  if (!Number.isInteger(an) || an < AN_MIN || an > AN_MAX) {
    return NextResponse.json(
      { error: `Anul nasterii trebuie sa fie intre ${AN_MIN} si ${AN_MAX}.` },
      { status: 400 }
    )
  }

  const parinteNume = textCurat(body.parinteNume, 120)
  const parinteTelefon = textCurat(body.parinteTelefon, 30)
  const parinteEmail = textCurat(body.parinteEmail, 160).toLowerCase()
  if (parinteNume.length < 3) {
    return NextResponse.json({ error: 'Numele parintelui este obligatoriu.' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.acordFotoCopil.update({
      where: { id },
      data: {
        nume,
        anNastere: an,
        grupa,
        pozitie: textCurat(body.pozitie, 60) || null,
        telefon: textCurat(body.telefon, 30) || null,
        email: textCurat(body.email, 160).toLowerCase() || null,
      },
    }),
    prisma.acordFoto.update({
      where: { id: copil.acordId },
      data: {
        parinteNume,
        parinteTelefon,
        parinteEmail,
        consimtSite: body.consimtSite === true,
        consimtFacebook: body.consimtFacebook === true,
        consimtInstagram: body.consimtInstagram === true,
        consimtTikTok: body.consimtTikTok === true,
        consimtWhatsApp: body.consimtWhatsApp === true,
      },
    }),
  ])

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const authz = await requirePermission('athletes.manage')
  if (authz.error) return authz.error

  const { id } = await props.params
  const copil = await prisma.acordFotoCopil.findUnique({
    where: { id },
    select: { id: true, acordId: true, pozaUrl: true },
  })
  if (!copil) return NextResponse.json({ error: 'Intrarea nu exista' }, { status: 404 })

  await stergePoza(copil.pozaUrl)
  await prisma.acordFotoCopil.delete({ where: { id } })

  // O declaratie fara niciun copil nu mai inseamna nimic: ar ramane o semnatura
  // care nu mai atesta nimic. Daca a fost ultimul, plecam si cu declaratia.
  const ramasi = await prisma.acordFotoCopil.count({ where: { acordId: copil.acordId } })
  let declaratieStearsa = false
  if (ramasi === 0) {
    await prisma.acordFoto.delete({ where: { id: copil.acordId } })
    declaratieStearsa = true
  }

  return NextResponse.json({ success: true, declaratieStearsa })
}
