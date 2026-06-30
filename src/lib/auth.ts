import { type NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/auth/onboarding',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials')
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) throw new Error('Invalid credentials')

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          username: user.username,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.username = token.username as string
        session.user.level = token.level as number
        session.user.xp = token.xp as number
        session.user.currency = (token.currency as string) || 'USD'
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.username = (user as { username: string }).username
      }
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub! },
        select: { level: true, xp: true, username: true, currency: true },
      })
      if (dbUser) {
        token.level = dbUser.level
        token.xp = dbUser.xp
        token.username = dbUser.username ?? undefined
        token.currency = dbUser.currency
      }
      return token
    },
  },
}
