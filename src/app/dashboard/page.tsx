'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Header, DesktopSidebar, TabBar } from '@/components/layout/navigation'
// Card, CardTitle, CardDescription exports are used elsewhere
import { ProgressBar } from '@/components/ui/progress'
import { XPBadge, CoinBadge, StreakBadge, HeartDisplay } from '@/components/ui/badges'
import { useAchievements } from '@/hooks/use-achievements'
import { getProgressToNextLevel, getLevelInfo } from '@/lib/utils'
import Link from 'next/link'
import {
  BookOpen,
  ArrowRight,
  Trophy,
  Check,
} from 'lucide-react'

interface UserStats {
  level: number
  xp: number
  coins: number
  hearts: number
  maxHearts: number
  streakCount: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const { achievements } = useAchievements()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/user')
        if (res.ok) {
          const data = await res.json() as UserStats
          setStats(data)
        }
      } catch {
        // fallback to defaults
      } finally {
        setLoadingStats(false)
      }
    }
    if (session) fetchStats()
  }, [session])

  if (status === 'loading' || loadingStats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
      </div>
    )
  }

  if (!session) return null

  const xp = stats?.xp ?? 0
  const level = stats?.level ?? 1
  const coins = stats?.coins ?? 0
  const hearts = stats?.hearts ?? 5
  const maxHearts = stats?.maxHearts ?? 5
  const streak = stats?.streakCount ?? 0

  const levelInfo = getLevelInfo(level)
  const progress = getProgressToNextLevel(xp, level)

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const recentAchievements = unlockedAchievements.slice(-3).reverse()

  const modules = [
    { title: 'Money Basics', icon: '💰', color: 'bg-brand-green', lessons: 4, href: '/quiz?module=module-1&lesson=0' },
    { title: 'Budgeting', icon: '📊', color: 'bg-brand-blue', lessons: 3, href: '/quiz?module=module-2&lesson=0' },
    { title: 'Banking', icon: '🏦', color: 'bg-brand-purple', lessons: 2, href: '/quiz?module=module-3&lesson=0' },
    { title: 'Credit', icon: '💳', color: 'bg-brand-orange', lessons: 3, href: '/quiz?module=module-4&lesson=0' },
    { title: 'Investing', icon: '📈', color: 'bg-brand-red', lessons: 2, href: '/quiz?module=module-5&lesson=0' },
    { title: 'Taxes', icon: '🧾', color: 'bg-green-500', lessons: 1, href: '/quiz?module=module-6&lesson=0' },
    { title: 'Advanced', icon: '🚀', color: 'bg-brand-purple', lessons: 2, href: '/quiz?module=module-7&lesson=0' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <div className="flex">
        <DesktopSidebar />
        <main className="flex-1 pb-20 pt-4 lg:pb-6">
        <div className="mx-auto max-w-5xl px-4">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Hey, {session.user?.name || 'there'}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Here is where you left off.</p>
          </div>

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-4 gap-2">
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-center dark:border-gray-800 dark:bg-gray-900">
              <XPBadge xp={xp} size="lg" />
              <p className="mt-0.5 text-xs text-gray-400">XP</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-center dark:border-gray-800 dark:bg-gray-900">
              <StreakBadge streak={streak} />
              <p className="mt-0.5 text-xs text-gray-400">Streak</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-center dark:border-gray-800 dark:bg-gray-900">
              <CoinBadge coins={coins} size="lg" />
              <p className="mt-0.5 text-xs text-gray-400">Coins</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-center dark:border-gray-800 dark:bg-gray-900">
              <HeartDisplay hearts={hearts} maxHearts={maxHearts} />
              <p className="mt-0.5 text-xs text-gray-400">Hearts</p>
            </div>
          </div>

          {/* Level */}
          <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Level {levelInfo.level}</p>
                <p className="text-xs text-gray-500">{xp} XP &middot; {levelInfo.title}</p>
              </div>
            </div>
            <ProgressBar value={progress} showLabel />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Learning Path */}
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Modules</h2>
                <Link href="/learn" className="text-xs font-medium text-brand-green">
                  See all
                </Link>
              </div>
              <div className="space-y-2">
                {modules.map((mod) => (
                  <Link key={mod.title} href={mod.href}>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-base ${mod.color} bg-opacity-10`}>
                        <span>{mod.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{mod.title}</p>
                        <p className="text-xs text-gray-400">{mod.lessons} lessons</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Side Column */}
            <div className="space-y-4">
              {recentAchievements.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Recent achievements</h2>
                  <div className="space-y-2">
                    {recentAchievements.map((ach) => (
                      <Link key={ach.key} href="/achievements">
                        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-base dark:bg-amber-900/30">
                            {ach.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ach.title}</p>
                            <p className="text-xs text-gray-400 truncate">{ach.description}</p>
                          </div>
                          <Check className="h-3.5 w-3.5 shrink-0 text-brand-green" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Quick links</h2>
                <div className="space-y-2">
                  <Link href="/learn">
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <BookOpen className="h-4 w-4 text-brand-blue" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Continue learning</span>
                      <ArrowRight className="ml-auto h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </Link>
                  <Link href="/tutor">
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <BookOpen className="h-4 w-4 text-brand-purple" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ask the tutor</span>
                      <ArrowRight className="ml-auto h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </Link>
                  <Link href="/achievements">
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Achievements
                        {unlockedAchievements.length > 0 && (
                          <span className="ml-1.5 rounded-full bg-brand-green px-1.5 py-0.5 text-xs text-white">
                            {unlockedAchievements.length}
                          </span>
                        )}
                      </span>
                      <ArrowRight className="ml-auto h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
      <TabBar />
    </div>
  )
}
