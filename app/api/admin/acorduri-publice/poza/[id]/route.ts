import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'
import { citesteImaginePrivata } from '@/lib/upload-privat'

/** Singura cale catre poza unui copil din acorduri. Cere permisiune. */
export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const authz = await requirePermission('athletes.view')
  if (authz.error) return authz.error

  const { id } = await props.params
  const copil = await prisma.acordFotoCopil.findUnique({
    where: { id },
    select: { pozaUrl: true },
  })
  if (!copil?.pozaUrl) {
    return NextResponse.json({ error: 'Fara poza' }, { status: 404 })
  }

  const octeti = await citesteImaginePrivata('acorduri', copil.pozaUrl)
  if (!octeti) {
    return NextResponse.json({ error: 'Fisier lipsa' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(octeti), {
    headers: {
      'Content-Type': 'image/jpeg',
      // `private`: poza n-are voie sa ajunga in cache-uri comune.
      'Cache-Control': 'private, max-age=300',
    },
  })
}
