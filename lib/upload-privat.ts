import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

/**
 * Salveaza imagini care NU trebuie sa fie publice.
 *
 * `lib/upload.ts` scrie in `uploads/`, pe care nginx il serveste direct de pe
 * disc, oricui. Pentru poze din galerie e in regula. Pentru pozele tip buletin
 * ale copiilor, stranse odata cu acordul de imagine, nu e: sunt pentru evidenta
 * clubului, nu pentru publicare, iar parintele a semnat pentru altceva.
 *
 * De aceea fisierele stau in `private-uploads/`, un dosar pe care nginx nu-l
 * cunoaste, si se citesc doar prin ruta de administrare care cere permisiune.
 *
 * Numele fisierului e aleatoriu, nu derivat din numele copilului: un nume
 * ghicibil dintr-un dosar public ar fi fost oricum o problema, iar aici ne
 * asiguram ca nici scaparea unei singure adrese nu deconspira restul.
 */
const DIR_PRIVAT = path.join(process.cwd(), 'private-uploads')

export async function salveazaImaginePrivata(
  buffer: Buffer,
  subdosar: string
): Promise<string> {
  const tinta = path.join(DIR_PRIVAT, subdosar)
  await fs.mkdir(tinta, { recursive: true })

  // sharp reface imaginea de la zero. Pe langa redimensionare, asta arunca tot
  // ce nu e pixel: date EXIF (inclusiv coordonate GPS, pe care telefoanele le
  // pun in poze) si orice incarcatura ascunsa intr-un fisier doar aparent JPEG.
  const iesire = await sharp(buffer)
    .rotate()
    .resize({ width: 1200, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer()

  const nume = `${crypto.randomBytes(16).toString('hex')}.jpg`
  await fs.writeFile(path.join(tinta, nume), iesire)
  return nume
}

export async function citesteImaginePrivata(
  subdosar: string,
  nume: string
): Promise<Buffer | null> {
  // Numele vine din baza de date, dar il verificam oricum: o singura zi in care
  // cineva reuseste sa scrie „../../.env" acolo ar transforma ruta de citire
  // intr-o portita catre tot serverul.
  if (!/^[a-f0-9]{32}\.jpg$/.test(nume)) return null
  try {
    return await fs.readFile(path.join(DIR_PRIVAT, subdosar, nume))
  } catch {
    return null
  }
}
