import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string | null
      level?: number
      xp?: number
      currency?: string
    }
  }

  interface User {
    username?: string | null
    currency?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string
    level?: number
    xp?: number
    currency?: string
  }
}
