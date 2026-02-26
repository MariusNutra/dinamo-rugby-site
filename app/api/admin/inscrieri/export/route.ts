import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const url = new URL(req.url)
  const teamId = url.searchParams.get('teamId')

  const where: Record<string, unknown> = {}
  if (teamId) where.teamId = Number(teamId)

  const registrations = await prisma.registration.findMany({
    where,
    include: { team: true },
    orderBy: { createdAt: 'desc' },
  })

  const headers = ['Nume', 'Prenume', 'Data nasterii', 'Grupa', 'Parinte', 'Telefon', 'Email', 'Experienta', 'Status', 'Data inscriere']
  const rows = registrations.map(r => [
    r.childLastName,
    r.childFirstName,
    new Date(r.birthDate).toLocaleDateString('ro-RO'),
    r.team?.grupa || '',
    r.parentName,
    r.phone,
    r.email,
    r.experience || '',
    r.status,
    new Date(r.createdAt).toLocaleDateString('ro-RO'),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="inscrieri-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
