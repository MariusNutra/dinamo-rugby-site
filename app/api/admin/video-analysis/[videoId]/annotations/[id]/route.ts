import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { videoId: string; id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const { id } = params

  // Verify annotation exists and belongs to this video
  const annotation = await prisma.videoAnnotation.findUnique({
    where: { id },
  })

  if (!annotation) {
    return NextResponse.json({ error: 'Adnotare negasita' }, { status: 404 })
  }

  if (annotation.videoId !== Number(params.videoId)) {
    return NextResponse.json({ error: 'Adnotare negasita' }, { status: 404 })
  }

  await prisma.videoAnnotation.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
