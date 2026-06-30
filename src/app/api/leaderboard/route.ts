import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'weekly'

  const leaderboard = await prisma.leaderboardEntry.findMany({
    where: { period },
    orderBy: { score: 'desc' },
    take: 50,
  })

  return NextResponse.json(leaderboard)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { score: number; period?: string }

  const entry = await prisma.leaderboardEntry.upsert({
    where: {
      userId_period: {
        userId: session.user.id,
        period: body.period || 'weekly',
      },
    },
    update: {
      score: body.score,
    },
    create: {
      userId: session.user.id,
      score: body.score,
      period: body.period || 'weekly',
    },
  })

  return NextResponse.json(entry)
}
