import { prisma } from '@/lib/prisma'
import GalerieClient from './GalerieClient'

export const dynamic = 'force-dynamic'

export default async function GaleriePage() {
  const photos = await prisma.photo.findMany({
    where: { storyId: null },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      path: true,
      caption: true,
      grupa: true,
    },
  })

  return <GalerieClient photos={photos} />
}
