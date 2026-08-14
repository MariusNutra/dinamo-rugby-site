import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getAuthUser } from '@/lib/auth'
import { setCsrfCookie } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'
import { PERMISSIONS, getUserPermissions } from '@/lib/permissions'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is required')
  return secret
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(req: NextRequest) {
  // Check for Bearer token (mobile app)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as {
        parentId?: string
        coachId?: string
        email: string
        role: string
      }

      // Parent token
      if (decoded.parentId) {
        const parent = await prisma.parent.findUnique({
          where: { id: decoded.parentId },
          include: {
            children: {
              include: { team: true },
            },
          },
        })

        if (!parent) {
          return NextResponse.json({ authenticated: false })
        }

        return NextResponse.json({
          authenticated: true,
          user: {
            id: parent.id,
            name: parent.name,
            email: parent.email,
            phone: parent.phone,
            role: decoded.role || 'parent',
            mustChangePassword: parent.mustChangePassword,
            children: parent.children.map((c) => ({
              id: c.id,
              name: c.name,
              birthYear: c.birthYear,
              teamId: c.teamId ? String(c.teamId) : '',
              teamName: c.team?.grupa || '',
            })),
          },
        })
      }

      // Coach token
      if (decoded.coachId) {
        const coach = await prisma.coach.findUnique({
          where: { id: decoded.coachId },
          include: { team: true },
        })

        if (!coach) {
          return NextResponse.json({ authenticated: false })
        }

        return NextResponse.json({
          authenticated: true,
          user: {
            id: coach.id,
            name: coach.name,
            email: coach.email,
            phone: coach.phone,
            role: 'coach',
            mustChangePassword: coach.mustChangePassword,
            teamId: String(coach.teamId),
            teamName: coach.team?.grupa || '',
          },
        })
      }

      return NextResponse.json({ authenticated: false })
    } catch {
      return NextResponse.json({ authenticated: false })
    }
  }

  // Fallback: admin cookie auth (website)
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ authenticated: false })
  }

  // Meniul panoului se construieste din lista asta. Fara ea, ecranul aratase
  // toate cele 35 de sectiuni oricui — inclusiv unui antrenor, care primea 403
  // abia dupa ce dadea clic. Serverul e in continuare cel care decide accesul;
  // aici doar nu mai promitem ce oricum nu se poate.
  const permissions =
    user.role === 'admin' || user.role === 'superadmin'
      ? (Object.keys(PERMISSIONS) as string[])
      : await getUserPermissions(user.userId)

  const response = NextResponse.json({
    authenticated: true,
    role: user.role,
    permissions,
  })
  return setCsrfCookie(response)
}
