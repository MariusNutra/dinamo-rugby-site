import { prisma } from '@/lib/prisma'
import VideoHighlightsClient from './VideoHighlightsClient'

export const dynamic = 'force-dynamic'

export default async function VideoHighlightsPage() {
  const [videos, teams] = await Promise.all([
    prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.team.findMany({
      where: { active: true },
      select: { grupa: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  const serialized = videos.map(v => ({
    id: v.id,
    title: v.title,
    youtubeUrl: v.youtubeUrl,
    description: v.description,
    grupa: v.grupa,
    createdAt: v.createdAt.toISOString(),
  }))

  return <VideoHighlightsClient videos={serialized} teams={teams} />
}
