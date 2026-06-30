'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Header, DesktopSidebar, TabBar } from '@/components/layout/navigation'
import { Card, CardTitle, CardDescription } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress'
import { StreakBadge, LevelBadge } from '@/components/ui/badges'
import { getProgressToNextLevel, getLevelInfo } from '@/lib/utils'
import { supportedCurrencies, getCurrencyInfo } from '@/lib/content/registry'
import { Calendar, BookOpen, Zap, Target, ChevronDown, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const [updatingCurrency, setUpdatingCurrency] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  const handleCurrencyChange = async (code: string) => {
    setShowCurrencyPicker(false)
    setUpdatingCurrency(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: code }),
      })
      if (!res.ok) throw new Error('Failed to update currency')
      await update()
      toast.success(`Currency switched to ${code}`)
    } catch {
      toast.error('Failed to update currency')
    } finally {
      setUpdatingCurrency(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
      </div>
    )
  }

  if (!session) return null

  const levelInfo = getLevelInfo(1)
  const progress = getProgressToNextLevel(0, 1)

  const user = session.user
  const currentCurrency = getCurrencyInfo(user.currency || 'USD')

  const stats = [
    { label: 'Lessons Completed', value: '0', icon: BookOpen, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
    { label: 'Total XP Earned', value: '0', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Current Streak', value: '0 days', icon: Calendar, color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
    { label: 'Achievements', value: '0', icon: Target, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <div className="flex">
        <DesktopSidebar />
        <main className="flex-1 pb-20 pt-4 lg:pb-6">
        <div className="mx-auto max-w-3xl px-4">
          {/* Profile Header */}
          <Card className="mb-6 text-center">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-green text-2xl font-bold text-white">
                  {user.name?.charAt(0) || '?'}
                </div>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user.name || 'Learner'}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <LevelBadge level={levelInfo.level} title={levelInfo.title} />
                <StreakBadge streak={0} />
              </div>
            </div>
          </Card>

          {/* Level Progress */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Level Progress</CardTitle>
              <span className="text-sm text-gray-500">Level {levelInfo.level}</span>
            </div>
            <ProgressBar value={progress} showLabel color="purple" />
            <CardDescription className="mt-2">
              {levelInfo.title} - {Math.round(progress)}% to next level
            </CardDescription>
          </Card>

          {/* Stats Grid */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <Card key={stat.label} className="!p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <stat.icon className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Currency Settings */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Currency Preference</CardTitle>
            </div>
            <CardDescription className="mb-4">
              Choose the currency for your learning content. Lessons, examples, and amounts will be shown in your preferred currency.
            </CardDescription>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                disabled={updatingCurrency}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 py-2.5 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{currentCurrency.flag}</span>
                  <span className="font-medium">{currentCurrency.name}</span>
                  <span className="text-xs text-gray-400">({currentCurrency.code})</span>
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showCurrencyPicker ? 'rotate-180' : ''}`} />
              </button>
              {showCurrencyPicker && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white p-0.5 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {supportedCurrencies.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCurrencyChange(c.code)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        currentCurrency.code === c.code
                          ? 'bg-brand-green/10 text-brand-green font-semibold'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span>{c.name}</span>
                      <span className="text-xs text-gray-400">({c.code})</span>
                      {currentCurrency.code === c.code && (
                        <Check className="ml-auto h-4 w-4 text-brand-green" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your learning activity will appear here</CardDescription>
            <div className="mt-4 flex flex-col items-center py-8 text-gray-400">
              <BookOpen className="mb-2 h-8 w-8" />
              <p className="text-sm">Complete your first lesson to see activity</p>
            </div>
          </Card>
        </div>
      </main>
      </div>
      <TabBar />
    </div>
  )
}
