import { prisma } from '@/lib/prisma'
import MeciuriClient from './MeciuriClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Meciuri | Dinamo Rugby Juniori',
  description: 'Programul meciurilor de rugby juniori ale clubului CS Dinamo București. Rezultate, clasamente și statistici.',
}

export default async function MeciuriPage() {
  const [matches, teams] = await Promise.all([
    prisma.match.findMany({
      orderBy: { date: 'desc' },
    }),
    prisma.team.findMany({
      where: { active: true },
      select: { grupa: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  const categories = ['Toate', ...teams.map(t => t.grupa)]

  // Serialize dates for client component
  const serializedMatches = matches.map(m => ({
    id: m.id,
    category: m.category,
    matchType: m.matchType,
    round: m.round,
    date: m.date.toISOString(),
    location: m.location,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    isDinamo: m.isDinamo,
    notes: m.notes,
  }))

  return <MeciuriClient matches={serializedMatches} categories={categories} />
}
