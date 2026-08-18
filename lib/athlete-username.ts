import { prisma } from '@/lib/prisma'

/**
 * Numele de utilizator al sportivului, derivat din numele lui.
 *
 * Copiii nu au email, deci au nevoie de un identificator pe care sa-l poata
 * tine minte si scrie corect: diacriticele si spatiile dispar, ramane
 * `prenume.nume`. La coliziune se adauga un numar, nu anul nasterii — anul ar
 * spune tuturor varsta copilului doar din numele de utilizator.
 */
const DIACRITICE: Record<string, string> = {
  ă: 'a', â: 'a', î: 'i', ș: 's', ş: 's', ț: 't', ţ: 't',
  Ă: 'a', Â: 'a', Î: 'i', Ș: 's', Ş: 's', Ț: 't', Ţ: 't',
}

export function normalizeazaNume(nume: string): string {
  return nume
    .split('')
    .map((c) => DIACRITICE[c] ?? c)
    .join('')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join('.')
}

export async function propuneUsername(nume: string): Promise<string> {
  const baza = normalizeazaNume(nume) || 'sportiv'
  const existente = await prisma.child.findMany({
    where: { username: { startsWith: baza } },
    select: { username: true },
  })
  const luate = new Set(existente.map((e) => e.username).filter(Boolean) as string[])
  if (!luate.has(baza)) return baza
  for (let i = 2; i < 100; i++) {
    const candidat = `${baza}${i}`
    if (!luate.has(candidat)) return candidat
  }
  throw new Error('Nu am putut genera un nume de utilizator liber')
}
