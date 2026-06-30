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
    select: { role: true },
  })

  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [totalUsers, totalLessons, activeToday, modules] = await Promise.all([
    prisma.user.count(),
    prisma.lesson.count(),
    prisma.user.count({
      where: {
        lastActivity: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.module.findMany({
      include: {
        lessons: {
          include: {
            progress: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    }),
  ])

  return NextResponse.json({
    totalUsers,
    totalLessons,
    activeToday,
    modules,
  })
}
