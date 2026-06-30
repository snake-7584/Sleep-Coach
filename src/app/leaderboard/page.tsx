'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Header, DesktopSidebar, TabBar } from '@/components/layout/navigation'
import { Card } from '@/components/ui/card'
import { XPBadge } from '@/components/ui/badges'
import { motion } from 'framer-motion'
import { Medal, TrendingUp, Users, Globe } from 'lucide-react'

type LeaderboardPeriod = 'weekly' | 'monthly' | 'allTime'

const mockLeaderboard = [
  { rank: 1, name: 'MoneyWizard', xp: 15420, level: 8, avatar: '🧙', isCurrentUser: false },
  { rank: 2, name: 'SaverPro', xp: 12300, level: 7, avatar: '🦊', isCurrentUser: false },
  { rank: 3, name: 'BudgetQueen', xp: 10850, level: 6, avatar: '👑', isCurrentUser: false },
  { rank: 4, name: 'WealthBuilder', xp: 9200, level: 6, avatar: '🏗️', isCurrentUser: false },
  { rank: 5, name: 'CashFlowMaster', xp: 8700, level: 5, avatar: '💵', isCurrentUser: false },
  { rank: 6, name: 'InvestorPro', xp: 7500, level: 5, avatar: '📈', isCurrentUser: false },
  { rank: 7, name: 'SavingsGuru', xp: 6200, level: 4, avatar: '💰', isCurrentUser: false },
  { rank: 8, name: 'DebtDestroyer', xp: 5400, level: 4, avatar: '💪', isCurrentUser: false },
  { rank: 9, name: 'FinWiseStudent', xp: 3800, level: 3, avatar: '📚', isCurrentUser: false },
  { rank: 10, name: 'BeginnerLuck', xp: 2100, level: 2, avatar: '🌟', isCurrentUser: false },
]

const currentUserEntry = { rank: 42, name: 'You', xp: 450, level: 1, avatar: '🦉', isCurrentUser: true }

export default function LeaderboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly')

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

  const tabs = [
    { key: 'weekly' as const, label: 'Weekly', icon: TrendingUp },
    { key: 'monthly' as const, label: 'Monthly', icon: Users },
    { key: 'allTime' as const, label: 'All Time', icon: Globe },
  ]

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <div className="flex">
        <DesktopSidebar />
        <main className="flex-1 pb-20 pt-4 lg:pb-6">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Compete with other learners and climb the ranks
            </p>
          </div>

          {/* Period Tabs */}
          <div className="mb-6 flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPeriod(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  period === tab.key
                    ? 'bg-brand-green text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Top 3 Podium */}
          <div className="mb-8 flex items-end justify-center gap-4">
            {[2, 1, 3].map((pos) => {
              const entry = mockLeaderboard[pos - 1]
              const heights = ['h-24', 'h-32', 'h-20']
              return (
                <div key={pos} className="flex flex-col items-center">
                  <div className="mb-2 text-2xl">{entry.avatar}</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{entry.name}</div>
                  <XPBadge xp={entry.xp} size="sm" />
                  <div
                    className={`mt-2 flex w-20 items-center justify-center rounded-t-2xl font-bold text-white ${heights[pos - 1]} ${
                      pos === 1 ? 'bg-gradient-to-t from-yellow-500 to-yellow-400' :
                      pos === 2 ? 'bg-gradient-to-t from-gray-400 to-gray-300' :
                      'bg-gradient-to-t from-orange-600 to-orange-500'
                    }`}
                  >
                    <Medal className="h-6 w-6" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Leaderboard List */}
          <div className="space-y-2">
            {mockLeaderboard.map((entry, index) => (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`!p-4 ${entry.isCurrentUser ? 'ring-2 ring-brand-green' : ''}`}>
                  <div className="flex items-center gap-4">
                    <span className="w-8 text-center text-lg font-bold text-gray-400">
                      {getRankIcon(entry.rank)}
                    </span>
                    <span className="text-2xl">{entry.avatar}</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white">{entry.name}</p>
                      <p className="text-xs text-gray-400">Level {entry.level}</p>
                    </div>
                    <XPBadge xp={entry.xp} size="sm" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Current User */}
          <div className="mt-4">
            <Card className="!p-4 ring-2 ring-brand-green">
              <div className="flex items-center gap-4">
                <span className="w-8 text-center text-lg font-bold text-gray-400">#{currentUserEntry.rank}</span>
                <span className="text-2xl">{currentUserEntry.avatar}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 dark:text-white">{currentUserEntry.name}</p>
                  <p className="text-xs text-gray-400">Level {currentUserEntry.level}</p>
                </div>
                <XPBadge xp={currentUserEntry.xp} size="sm" />
              </div>
            </Card>
          </div>
        </div>
      </main>
      </div>
      <TabBar />
    </div>
  )
}
