import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.storeItem.findMany({
    where: { available: true },
  })

  const userItems = await prisma.userStoreItem.findMany({
    where: { userId: session.user.id },
  })

  const ownedSet = new Set(userItems.map(ui => ui.itemId))
  const equippedMap = new Map(userItems.filter(ui => ui.equipped).map(ui => [ui.itemId, true]))

  const result = items.map(item => ({
    ...item,
    owned: ownedSet.has(item.id),
    equipped: equippedMap.has(item.id) || false,
  }))

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { itemId: string }

  const item = await prisma.storeItem.findUnique({
    where: { id: body.itemId },
  })

  if (!item || !item.available) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true },
  })

  if (!user || user.coins < item.price) {
    return NextResponse.json({ error: 'Not enough coins' }, { status: 400 })
  }

  const existing = await prisma.userStoreItem.findUnique({
    where: {
      userId_itemId: {
        userId: session.user.id,
        itemId: body.itemId,
      },
    },
  })

  if (existing) {
    return NextResponse.json({ error: 'Already owned' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { coins: { decrement: item.price } },
    }),
    prisma.userStoreItem.create({
      data: {
        userId: session.user.id,
        itemId: body.itemId,
      },
    }),
  ])

  return NextResponse.json({ success: true, item })
}
