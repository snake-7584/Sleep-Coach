import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const achievements = await prisma.achievement.findMany()
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId: session.user.id },
  })

  const unlockedSet = new Set(userAchievements.map(ua => ua.achievementId))

  const result = achievements.map(a => ({
    ...a,
    unlocked: unlockedSet.has(a.id),
    unlockedAt: userAchievements.find(ua => ua.achievementId === a.id)?.unlockedAt,
  }))

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { key: string }

  const achievement = await prisma.achievement.findUnique({
    where: { key: body.key },
  })

  if (!achievement) {
    return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })
  }

  const existing = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: {
        userId: session.user.id,
        achievementId: achievement.id,
      },
    },
  })

  if (existing) {
    return NextResponse.json({ error: 'Already unlocked' }, { status: 400 })
  }

  const userAchievement = await prisma.userAchievement.create({
    data: {
      userId: session.user.id,
      achievementId: achievement.id,
    },
  })

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      xp: { increment: achievement.xpReward },
      coins: { increment: achievement.coinReward },
    },
  })

  return NextResponse.json(userAchievement)
}
