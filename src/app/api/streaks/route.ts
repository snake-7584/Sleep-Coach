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
    select: { streakCount: true, lastActivity: true },
  })

  return NextResponse.json(user)
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { streakCount: true, lastActivity: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const now = new Date()
  const lastActivity = user.lastActivity
  let newStreak = 1

  if (lastActivity) {
    const daysSinceLastActivity = Math.floor(
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceLastActivity === 1) {
      newStreak = user.streakCount + 1
    } else if (daysSinceLastActivity === 0) {
      newStreak = user.streakCount
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      streakCount: newStreak,
      lastActivity: now,
      coins: { increment: newStreak > user?.streakCount ? 10 : 0 },
    },
  })

  return NextResponse.json({ streakCount: newStreak })
}
