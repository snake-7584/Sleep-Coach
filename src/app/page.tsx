'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function HomePage() {
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'authenticated') {
      router.replace('/dashboard')
    } else {
      router.replace('/auth/signin')
    }
  }, [status, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  )
}
