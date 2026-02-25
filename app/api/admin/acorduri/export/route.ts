import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const children = await prisma.child.findMany({
    include: {
      parent: { select: { name: true, email: true, phone: true } },
      team: { select: { grupa: true } },
    },
    orderBy: [{ team: { grupa: 'asc' } }, { name: 'asc' }],
  })

  const header = 'Copil,An nastere,Echipa,Acord site,Acord WA,Data acord,Parinte,Email,Telefon'
  const rows = children.map(c => {
    const date = c.photoConsentDate
      ? new Date(c.photoConsentDate).toLocaleDateString('ro-RO')
      : ''
    return [
      `"${c.name}"`,
      c.birthYear,
      `"${c.team?.grupa ?? ''}"`,
      c.photoConsent ? 'Da' : 'Nu',
      c.photoConsentWA ? 'Da' : 'Nu',
      date,
      `"${c.parent.name}"`,
      c.parent.email,
      c.parent.phone || '',
    ].join(',')
  })

  const csv = [header, ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="acorduri-foto-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
