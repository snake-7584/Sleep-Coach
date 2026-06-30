import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const challenges = await prisma.dailyChallenge.findMany({
    where: {
      active: true,
      OR: [
        { date: null },
        { date: { gte: today } },
      ],
    },
  })

  const progress = await prisma.challengeProgress.findMany({
    where: {
      userId: session.user.id,
      challengeId: { in: challenges.map(c => c.id) },
    },
  })

  const progressMap = new Map(progress.map(p => [p.challengeId, p]))

  const result = challenges.map(c => ({
    ...c,
    progress: progressMap.get(c.id)?.progress || 0,
    completed: progressMap.get(c.id)?.completed || false,
  }))

  return NextResponse.json(result)
}
