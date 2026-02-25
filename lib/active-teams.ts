import { prisma } from '@/lib/prisma'

export async function getActiveGrupe(): Promise<string[]> {
  const teams = await prisma.team.findMany({
    where: { active: true },
    orderBy: { grupa: 'asc' },
    select: { grupa: true },
  })
  return teams.map(t => t.grupa)
}
