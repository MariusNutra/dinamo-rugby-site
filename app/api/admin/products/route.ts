import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authz'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const authz = await requirePermission('shop.manage')
  if (authz.error) return authz.error
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const authz = await requirePermission('shop.manage')
  if (authz.error) return authz.error
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { name, description, price, image, stock, category } = body

  if (!name || !price || typeof price !== 'number' || price <= 0) {
    return NextResponse.json({ error: 'Numele si pretul sunt obligatorii' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      name: String(name).slice(0, 200),
      description: description ? String(description).slice(0, 2000) : null,
      price,
      image: image ? String(image) : null,
      stock: stock ? Number(stock) : 0,
      category: category ? String(category).slice(0, 100) : null,
    },
  })
  return NextResponse.json(product, { status: 201 })
}
