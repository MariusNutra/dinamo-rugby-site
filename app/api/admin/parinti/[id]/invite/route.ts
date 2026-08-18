import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'
import { trimiteInvitatieParinte } from '@/lib/invitatie-parinte'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authz = await requirePermission('parents.manage')
  if (authz.error) return authz.error

  const { id } = await params

  try {
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: {
        children: {
          include: { team: { select: { grupa: true } } },
        },
      },
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parintele nu a fost gasit' }, { status: 404 })
    }

    const trimis = await trimiteInvitatieParinte(parent, parent.children)

    // sendEmail inghite erorile si intoarce false; fara verificarea asta panoul
    // ar raporta „trimisa" pentru un mail care n-a plecat niciodata.
    if (!trimis) {
      return NextResponse.json({ error: 'Emailul nu a putut fi trimis' }, { status: 502 })
    }

    return NextResponse.json({ success: true, message: 'Invitatia a fost trimisa' })
  } catch (error) {
    console.error('Error sending invite:', error)
    return NextResponse.json({ error: 'Eroare la trimiterea invitatiei' }, { status: 500 })
  }
}
