import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const progress = await prisma.userProgress.findMany({
    where: { userId: session.user.id },
    include: { lesson: true },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(progress)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { lessonId: string; completed?: boolean; score?: number; xpEarned?: number; coinReward?: number }
  const userCurrency = session?.user?.currency || 'USD'

  const existing = await prisma.userProgress.findUnique({
    where: {
      userId_lessonId_currency: {
        userId: session.user.id,
        lessonId: body.lessonId,
        currency: userCurrency,
      },
    },
  })

  let progress
  if (existing) {
    progress = await prisma.userProgress.update({
      where: { id: existing.id },
      data: {
        completed: body.completed ?? existing.completed,
        score: Math.max(body.score ?? existing.score, existing.score),
        xpEarned: Math.max(body.xpEarned ?? existing.xpEarned, existing.xpEarned),
        attempts: existing.attempts + 1,
      },
    })
  } else {
    progress = await prisma.userProgress.create({
      data: {
        userId: session.user.id,
        lessonId: body.lessonId,
        currency: userCurrency,
        completed: body.completed ?? false,
        score: body.score ?? 0,
        xpEarned: body.xpEarned ?? 0,
        attempts: 1,
      },
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        xp: { increment: body.xpEarned ?? 0 },
        coins: { increment: body.coinReward ?? 0 },
      },
    })
  }

  return NextResponse.json(progress)
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { lessonId: string; score: number; maxScore: number; answers?: Record<string, string> }
  const userCurrency = session?.user?.currency || 'USD'

  const result = await prisma.quizResult.create({
    data: {
      userId: session.user.id,
      lessonId: body.lessonId,
      currency: userCurrency,
      score: body.score,
      maxScore: body.maxScore,
      answers: JSON.stringify(body.answers || {}),
    },
  })

  return NextResponse.json(result)
}
