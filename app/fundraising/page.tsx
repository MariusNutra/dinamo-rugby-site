import { prisma } from '@/lib/prisma'
import FundraisingClient from './FundraisingClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Fundraising | Dinamo Rugby Juniori',
  description: 'Sprijină secția de juniori rugby a clubului CS Dinamo București. Campaniile noastre de strângere de fonduri.',
}

export default async function FundraisingPage() {
  const campaigns = await prisma.campaign.findMany({
    where: { active: true },
    include: {
      donations: {
        where: { status: 'completed' },
        select: {
          id: true,
          donorName: true,
          amount: true,
          anonymous: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Serialize dates
  const serialized = campaigns.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    image: c.image,
    goalAmount: c.goalAmount,
    currentAmount: c.currentAmount,
    deadline: c.deadline?.toISOString() ?? null,
    showDonors: c.showDonors,
    allowAnonymous: c.allowAnonymous,
    donations: c.donations.map(d => ({
      id: d.id,
      donorName: d.donorName,
      amount: d.amount,
      anonymous: d.anonymous,
      createdAt: d.createdAt.toISOString(),
    })),
  }))

  return <FundraisingClient initialCampaigns={serialized} />
}
