import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const modules = await prisma.module.findMany({
    include: {
      lessons: {
        where: { published: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(modules)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { title: string; description: string; icon?: string; color?: string; order: number; xpReward?: number; coinReward?: number }

  const mod = await prisma.module.create({
    data: {
      title: body.title,
      description: body.description,
      icon: body.icon || '📚',
      color: body.color || '#58cc02',
      order: body.order,
      xpReward: body.xpReward || 50,
      coinReward: body.coinReward || 10,
    },
  })

  return NextResponse.json(mod)
}
