import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentId } from '@/lib/parent-auth'

export async function GET() {
  const parentId = await getParentId()
  if (!parentId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  // Get parent's children team IDs
  const children = await prisma.child.findMany({
    where: { parentId },
    select: { teamId: true },
  })

  const teamIds = children.map(c => c.teamId).filter((id): id is number => id !== null)

  // Fetch documents: either targetGroup='all' or matching team
  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { targetGroup: 'all' },
        ...(teamIds.length > 0 ? [{ targetGroup: 'team', teamId: { in: teamIds } }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      category: true,
      filePath: true,
      fileSize: true,
      mimeType: true,
      createdAt: true,
      team: { select: { grupa: true } },
    },
  })

  return NextResponse.json(documents)
}
