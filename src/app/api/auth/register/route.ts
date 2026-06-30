import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generateUsername } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const { email, password, name, currency } = await request.json() as { email: string; password: string; name?: string; currency?: string }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const username = generateUsername()

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash,
        username,
        displayName: name || email.split('@')[0],
        currency: currency || 'USD',
      },
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
