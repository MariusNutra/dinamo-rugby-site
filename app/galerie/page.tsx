import { prisma } from '@/lib/prisma'
import GalerieClient from './GalerieClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Galerie Foto | Dinamo Rugby Juniori',
  description: 'Galeria foto a secției de juniori rugby CS Dinamo București. Fotografii de la antrenamente, meciuri și evenimente.',
}

export default async function GaleriePage() {
  // `published` decide ce se vede public. Pozele mai vechi au implicit true,
  // deci galeria arata la fel ca inainte; ce incarca fotograful ca ciorna
  // ramane doar in portalul lui, pana o trece pe site.
  const [photos, clips] = await Promise.all([
    prisma.photo.findMany({
      where: { storyId: null, published: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        path: true,
        title: true,
        caption: true,
        grupa: true,
      },
    }),
    prisma.videoClip.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        path: true,
        posterPath: true,
        title: true,
        description: true,
        grupa: true,
        durationSec: true,
      },
    }),
  ])

  return <GalerieClient photos={photos} clips={clips} />
}
