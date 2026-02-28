import { prisma } from '@/lib/prisma'
import MagazinClient from './MagazinClient'

export const dynamic = 'force-dynamic'

export default async function MagazinPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  })

  const serialized = products.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    image: p.image,
    stock: p.stock,
    category: p.category,
  }))

  return <MagazinClient products={serialized} />
}
