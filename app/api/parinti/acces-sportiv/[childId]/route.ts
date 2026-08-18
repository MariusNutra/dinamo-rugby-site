import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'
import { propuneUsername } from '@/lib/athlete-username'
import { validatePassword } from '@/lib/password-policy'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * Accesul propriu al unui sportiv, deschis si inchis DE PARINTE.
 *
 * Copiii clubului au intre 10 si 16 ani. Sub 16 ani copilul nu poate consimti
 * singur la prelucrarea datelor sale, deci contul nu se poate crea de la sine:
 * decizia si parola vin de la parinte, iar accesul nu cere nicio informatie noua
 * despre copil (fara email, fara telefon).
 *
 * GET    — starea accesului + numele de utilizator propus
 * POST   — deschide accesul sau schimba parola
 * DELETE — inchide accesul (pastreaza numele de utilizator, ca sa nu-l ia altul)
 */

async function copilulMeu(childId: string) {
  const parentId = await getParentId()
  if (!parentId) return { eroare: NextResponse.json({ error: 'Neautorizat' }, { status: 401 }) }
  // Proprietarul intra in interogare, nu intr-un `if` de dupa citire: un id
  // ghicit nu atinge copilul altcuiva, indiferent ce ramuri se adauga aici.
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId },
    select: { id: true, name: true, username: true, accessEnabled: true, password: true },
  })
  if (!child) return { eroare: NextResponse.json({ error: 'Copilul nu a fost gasit' }, { status: 404 }) }
  return { child }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params
  const { child, eroare } = await copilulMeu(childId)
  if (eroare) return eroare

  return NextResponse.json({
    accessEnabled: child.accessEnabled,
    username: child.username ?? (await propuneUsername(child.name)),
    areParola: Boolean(child.password),
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params

  const limita = await checkRateLimit(getClientIp(req), {
    action: 'parinti_acces_sportiv',
    maxAttempts: 20,
    windowMs: 15 * 60 * 1000,
  })
  if (!limita.allowed) {
    return NextResponse.json({ error: 'Prea multe incercari. Reincearca mai tarziu.' }, { status: 429 })
  }

  const { child, eroare } = await copilulMeu(childId)
  if (eroare) return eroare

  let password: unknown
  try {
    password = (await req.json()).password
  } catch {
    return NextResponse.json({ error: 'Date invalide.' }, { status: 400 })
  }

  const verificare = validatePassword(password)
  if (!verificare.ok) return NextResponse.json({ error: verificare.error }, { status: 400 })

  const username = child.username ?? (await propuneUsername(child.name))

  await prisma.child.update({
    where: { id: child.id },
    data: {
      username,
      password: await bcrypt.hash(password as string, 12),
      accessEnabled: true,
    },
  })

  return NextResponse.json({
    success: true,
    username,
    message: child.accessEnabled ? 'Parola a fost schimbata.' : 'Accesul a fost deschis.',
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params
  const { child, eroare } = await copilulMeu(childId)
  if (eroare) return eroare

  // Numele de utilizator ramane rezervat: daca parintele redeschide accesul,
  // copilul intra cu acelasi nume, iar intre timp nu-l poate lua altcineva.
  await prisma.child.update({
    where: { id: child.id },
    data: { accessEnabled: false, password: null },
  })

  // Dispozitivele sportivului nu mai primesc notificari.
  await prisma.pushSubscription.deleteMany({ where: { childId: child.id } })

  return NextResponse.json({ success: true, message: 'Accesul a fost inchis.' })
}
