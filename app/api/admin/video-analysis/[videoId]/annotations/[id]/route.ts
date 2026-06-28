import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authz'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { videoId: string; id: string } }
) {
  const authz = await requirePermission('matches.manage')
  if (authz.error) return authz.error
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
