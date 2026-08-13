import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authz'

/** Un rand per COPIL, nu per acord: asa se poate cauta si sorta dupa copil. */
export async function GET() {
  const authz = await requirePermission('athletes.view')
  if (authz.error) return authz.error

  const acorduri = await prisma.acordFoto.findMany({
    orderBy: { createdAt: 'desc' },
    include: { copii: true },
  })

  const cap = [
    'Data', 'Parinte', 'Telefon parinte', 'Email parinte',
    'Copil', 'An nastere', 'Grupa', 'Telefon copil', 'Email copil',
    'Acord site+Facebook', 'Acord WhatsApp', 'Are poza',
  ]

  const scapa = (v: unknown) => {
    const s = String(v ?? '')
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const randuri = acorduri.flatMap((a) =>
    a.copii.map((c) =>
      [
        a.createdAt.toISOString().slice(0, 16).replace('T', ' '),
        a.parinteNume, a.parinteTelefon, a.parinteEmail,
        c.nume, c.anNastere, c.grupa, c.telefon ?? '', c.email ?? '',
        a.consimtSite ? 'DA' : 'NU',
        a.consimtWhatsApp ? 'DA' : 'NU',
        c.pozaUrl ? 'DA' : 'NU',
      ].map(scapa).join(',')
    )
  )

  // BOM, ca Excel sa nu strice diacriticele la deschidere.
  const csv = '﻿' + [cap.join(','), ...randuri].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="acorduri-foto-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
