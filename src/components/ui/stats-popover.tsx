'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import * as Popover from '@radix-ui/react-popover'
import { getCurrencyInfo, supportedCurrencies } from '@/lib/content/registry'
import { getLevelInfo, getProgressToNextLevel } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Zap,
  Heart,
  Flame,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface UserStats {
  level: number
  xp: number
  coins: number
  hearts: number
  maxHearts: number
  streakCount: number
  currency: string
}

export function StatsPopover({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession()
  const [open, setOpen] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [showCurrencyList, setShowCurrencyList] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (open && !fetched) {
      setFetched(true)
      fetch('/api/user')
        .then((r) => r.json())
        .then((data) => setStats(data))
        .catch(() => {})
    }
  }, [open, fetched])

  const levelInfo = getLevelInfo(stats?.level ?? session?.user?.level ?? 1)
  const progress = getProgressToNextLevel(
    stats?.xp ?? session?.user?.xp ?? 0,
    stats?.level ?? session?.user?.level ?? 1
  )
  const currentCurrency = getCurrencyInfo(stats?.currency ?? session?.user?.currency ?? 'USD')

  const handleCurrencyChange = async (code: string) => {
    setShowCurrencyList(false)
    setUpdating(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: code }),
      })
      if (!res.ok) throw new Error('Failed to update currency')
      await update()
      setStats((prev) => (prev ? { ...prev, currency: code } : prev))
      toast.success(`Switched to ${code}`)
    } catch {
      toast.error('Failed to update currency')
    } finally {
      setUpdating(false)
    }
  }

  const xp = stats?.xp ?? session?.user?.xp ?? 0
  const coins = stats?.coins ?? 0
  const hearts = stats?.hearts ?? 5
  const maxHearts = stats?.maxHearts ?? 5
  const streak = stats?.streakCount ?? 0

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="end"
          className="z-50 w-72 rounded-xl border border-gray-100 bg-white shadow-lg outline-none dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="p-3">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Stats
              </h3>
            </div>

            {/* Level Progress */}
            <div className="mb-3 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Level {levelInfo.level}
                </span>
                <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
              </div>
              <ProgressBar value={progress} size="sm" />
              <p className="mt-0.5 text-[10px] text-gray-400">
                {xp.toLocaleString()} / {levelInfo.xpRequired.toLocaleString()} XP
              </p>
            </div>

            {/* Stats Grid */}
            <div className="mb-3 grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {xp.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-500">XP</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                <span className="text-sm">🪙</span>
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {coins.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-500">Coins</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{streak}</p>
                  <p className="text-[10px] text-gray-500">Streak</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                <Heart className="h-3.5 w-3.5 text-red-400" />
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {hearts}/{maxHearts}
                  </p>
                  <p className="text-[10px] text-gray-500">Hearts</p>
                </div>
              </div>
            </div>

            {/* Currency Selector */}
            <div>
              <p className="mb-1 text-[10px] font-medium text-gray-400">
                Currency
              </p>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCurrencyList(!showCurrencyList)}
                  disabled={updating}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm dark:border-gray-700 disabled:opacity-50"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm">{currentCurrency.flag}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {currentCurrency.name}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showCurrencyList ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {showCurrencyList && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 space-y-0.5 rounded-lg border border-gray-100 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800">
                        {supportedCurrencies.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleCurrencyChange(c.code)}
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                              currentCurrency.code === c.code
                                ? 'bg-white font-medium text-brand-green dark:bg-gray-700'
                                : 'text-gray-600 hover:bg-white dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                          >
                            <span className="text-sm">{c.flag}</span>
                            <span>{c.name}</span>
                            {currentCurrency.code === c.code && (
                              <Check className="ml-auto h-3 w-3 text-brand-green" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between border-t border-gray-100 px-3 py-2.5 text-sm font-medium text-brand-green dark:border-gray-700"
          >
            View full profile
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>

          <Popover.Arrow className="fill-white dark:fill-gray-900" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
