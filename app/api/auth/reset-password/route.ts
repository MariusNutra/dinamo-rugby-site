import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { revokeAllRefreshTokens } from '@/lib/unified-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(req: NextRequest) {
  let token: string, type: string, newPassword: string
  try {
    const body = await req.json()
    token = body.token
    type = body.type
    newPassword = body.newPassword
  } catch {
    return NextResponse.json({ error: 'Date invalide.' }, { status: 400 })
  }

  if (!token || !type || !newPassword) {
    return NextResponse.json(
      { error: 'Token, tip și parola nouă sunt obligatorii.' },
      { status: 400 }
    )
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: 'Parola trebuie să aibă cel puțin 6 caractere.' },
      { status: 400 }
    )
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)
  const now = new Date()

  try {
    if (type === 'parent') {
      const parent = await prisma.parent.findFirst({
        where: { token, tokenExpiry: { gt: now } },
      })

      if (!parent) {
        return NextResponse.json(
          { error: 'Link-ul de resetare este invalid sau a expirat.' },
          { status: 400 }
        )
      }

      await prisma.parent.update({
        where: { id: parent.id },
        data: {
          password: hashedPassword,
          token: null,
          tokenExpiry: null,
          mustChangePassword: false,
        },
      })

      await revokeAllRefreshTokens({ parentId: parent.id })
      return NextResponse.json({ success: true })
    }

    if (type === 'coach') {
      const coach = await prisma.coach.findFirst({
        where: { resetToken: token, resetTokenExpiry: { gt: now } },
      })

      if (!coach) {
        return NextResponse.json(
          { error: 'Link-ul de resetare este invalid sau a expirat.' },
          { status: 400 }
        )
      }

      await prisma.coach.update({
        where: { id: coach.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
          mustChangePassword: false,
        },
      })

      await revokeAllRefreshTokens({ coachId: coach.id })
      return NextResponse.json({ success: true })
    }

    if (type === 'admin') {
      const user = await prisma.user.findFirst({
        where: { resetToken: token, resetTokenExpiry: { gt: now }, active: true },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Link-ul de resetare este invalid sau a expirat.' },
          { status: 400 }
        )
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
          mustChangePassword: false,
        },
      })

      await revokeAllRefreshTokens({ userId: user.id })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Tip invalid.' }, { status: 400 })
  } catch (error) {
    console.error('[reset-password] Error:', error)
    return NextResponse.json({ error: 'Eroare la resetarea parolei.' }, { status: 500 })
  }
}
