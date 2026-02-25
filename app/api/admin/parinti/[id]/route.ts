import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.parent.findUnique({
      where: { id },
      include: { children: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Parintele nu a fost gasit' }, { status: 404 })
    }

    const body = await req.json()
    const { name, email, phone, children } = body

    // Validate email uniqueness if changed
    if (email && email.toLowerCase().trim() !== existing.email) {
      const emailExists = await prisma.parent.findUnique({
        where: { email: email.toLowerCase().trim() },
      })
      if (emailExists) {
        return NextResponse.json({ error: 'Exista deja un parinte cu acest email' }, { status: 409 })
      }
    }

    // Build parent update data
    const parentData: Record<string, unknown> = {}
    if (name !== undefined) parentData.name = name.trim()
    if (email !== undefined) parentData.email = email.toLowerCase().trim()
    if (phone !== undefined) parentData.phone = phone?.trim() || null

    const currentYear = new Date().getFullYear()

    // Update parent and manage children in a transaction
    const updatedParent = await prisma.$transaction(async (tx) => {
      // Update parent fields
      if (Object.keys(parentData).length > 0) {
        await tx.parent.update({
          where: { id },
          data: parentData,
        })
      }

      // Handle children updates if provided
      if (children && Array.isArray(children)) {
        const existingChildIds = existing.children.map(c => c.id)
        const incomingChildIds = children.filter((c: { id?: string }) => c.id).map((c: { id: string }) => c.id)

        // Delete removed children
        const childrenToRemove = existingChildIds.filter(cid => !incomingChildIds.includes(cid))
        if (childrenToRemove.length > 0) {
          await tx.child.deleteMany({
            where: { id: { in: childrenToRemove } },
          })
        }

        // Update or create children
        for (const child of children) {
          if (!child.name || typeof child.name !== 'string' || child.name.trim().length < 2) {
            throw new Error('Numele copilului este obligatoriu (min. 2 caractere)')
          }
          const year = Number(child.birthYear)
          if (!year || year < currentYear - 20 || year > currentYear) {
            throw new Error(`Anul nasterii pentru ${child.name} este invalid`)
          }

          if (child.teamId !== null && child.teamId !== undefined) {
            const team = await tx.team.findUnique({ where: { id: Number(child.teamId) } })
            if (!team) {
              throw new Error(`Echipa selectata pentru ${child.name} nu exista`)
            }
          }

          if (child.id && existingChildIds.includes(child.id)) {
            // Update existing child
            await tx.child.update({
              where: { id: child.id },
              data: {
                name: child.name.trim(),
                birthYear: year,
                teamId: child.teamId ? Number(child.teamId) : null,
              },
            })
          } else {
            // Create new child
            await tx.child.create({
              data: {
                name: child.name.trim(),
                birthYear: year,
                parentId: id,
                teamId: child.teamId ? Number(child.teamId) : null,
              },
            })
          }
        }
      }

      return await tx.parent.findUnique({
        where: { id },
        include: {
          children: {
            include: { team: { select: { id: true, grupa: true } } },
          },
        },
      })
    })

    return NextResponse.json({
      success: true,
      parent: {
        id: updatedParent!.id,
        name: updatedParent!.name,
        email: updatedParent!.email,
        phone: updatedParent!.phone,
        children: updatedParent!.children.map(c => ({
          id: c.id,
          name: c.name,
          birthYear: c.birthYear,
          teamId: c.teamId,
          teamName: c.team?.grupa ?? null,
        })),
      },
    })
  } catch (error) {
    console.error('Error updating parent:', error)
    const message = error instanceof Error ? error.message : 'Eroare la actualizarea parintelui'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.parent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Parintele nu a fost gasit' }, { status: 404 })
    }

    // Cascade delete is handled by Prisma schema (onDelete: Cascade on Child)
    await prisma.parent.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Parintele a fost sters' })
  } catch (error) {
    console.error('Error deleting parent:', error)
    return NextResponse.json({ error: 'Eroare la stergerea parintelui' }, { status: 500 })
  }
}
