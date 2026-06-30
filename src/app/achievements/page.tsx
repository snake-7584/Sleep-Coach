'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Header, DesktopSidebar, TabBar } from '@/components/layout/navigation'
import { Card, CardTitle, CardDescription } from '@/components/ui/card'
import { XPBadge, CoinBadge } from '@/components/ui/badges'
import { useAchievements } from '@/hooks/use-achievements'
import { motion } from 'framer-motion'
import { Lock, Check, Trophy, Sparkles } from 'lucide-react'

export default function AchievementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { achievements, loading } = useAchievements()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
      </div>
    )
  }

  if (!session) return null

  const unlocked = achievements.filter(a => a.unlocked)
  const locked = achievements.filter(a => !a.unlocked)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <div className="flex">
        <DesktopSidebar />
        <main className="flex-1 pb-20 pt-4 lg:pb-6">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Achievements</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Complete challenges to earn XP and coins
            </p>
          </div>

          <div className="mb-6 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-brand-gold" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {unlocked.length} / {achievements.length} Unlocked
            </span>
            {unlocked.length === achievements.length && achievements.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <Sparkles className="h-3 w-3" /> Complete!
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
            </div>
          ) : achievements.length === 0 ? (
            <Card className="py-16 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
              <CardTitle className="mb-1">No achievements yet</CardTitle>
              <CardDescription>Start learning to unlock your first achievement!</CardDescription>
            </Card>
          ) : (
            <>
              {unlocked.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Unlocked ({unlocked.length})
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {unlocked.map((achievement, index) => (
                      <motion.div
                        key={achievement.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card>
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl dark:bg-amber-900/30">
                              {achievement.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <CardTitle>{achievement.title}</CardTitle>
                                <Check className="h-5 w-5 text-brand-green" />
                              </div>
                              <CardDescription>{achievement.description}</CardDescription>
                              <div className="mt-2 flex gap-3">
                                <XPBadge xp={achievement.xpReward} size="sm" />
                                <CoinBadge coins={achievement.coinReward} size="sm" />
                              </div>
                              {achievement.unlockedAt && (
                                <p className="mt-2 text-xs text-gray-400">
                                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {locked.length > 0 && (
                <div>
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Locked ({locked.length})
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {locked.map((achievement, index) => (
                      <motion.div
                        key={achievement.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="opacity-60">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                              <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-gray-400">{achievement.title}</CardTitle>
                              </div>
                              <CardDescription>{achievement.description}</CardDescription>
                              <div className="mt-2 flex gap-3">
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800">
                                  <Lock className="h-3 w-3" />
                                  {achievement.xpReward} XP
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      </div>
      <TabBar />
    </div>
  )
}
