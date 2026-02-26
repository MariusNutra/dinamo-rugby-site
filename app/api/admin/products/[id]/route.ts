import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  const body = await req.json()
  const { name, description, price, image, stock, category, active } = body

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name: String(name).slice(0, 200) }),
      ...(description !== undefined && { description: description ? String(description).slice(0, 2000) : null }),
      ...(price !== undefined && { price }),
      ...(image !== undefined && { image }),
      ...(stock !== undefined && { stock: Number(stock) }),
      ...(category !== undefined && { category: category ? String(category).slice(0, 100) : null }),
      ...(active !== undefined && { active }),
    },
  })
  return NextResponse.json(product)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  const csrfError = validateCsrf(req)
  if (csrfError) return csrfError

  await prisma.product.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
