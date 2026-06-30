import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      level: true,
      xp: true,
      coins: true,
      hearts: true,
      maxHearts: true,
      streakCount: true,
      currency: true,
    },
  })

  return NextResponse.json(user)
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { xp?: number; coins?: number; hearts?: number; currency?: string }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(body.xp !== undefined && { xp: { increment: body.xp } }),
      ...(body.coins !== undefined && { coins: { increment: body.coins } }),
      ...(body.hearts !== undefined && { hearts: body.hearts }),
      ...(body.currency !== undefined && { currency: body.currency }),
    },
  })

  return NextResponse.json({
    level: user.level,
    xp: user.xp,
    coins: user.coins,
    hearts: user.hearts,
  })
}
