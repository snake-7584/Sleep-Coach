'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { XPBadge, CoinBadge } from '@/components/ui/badges'
import { ChevronRight, X } from 'lucide-react'
import { useState } from 'react'
import type { Achievement } from '@/types'

interface Props {
  achievements: Achievement[]
  onDismiss: () => void
}

export function AchievementNotification({ achievements, onDismiss }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (achievements.length === 0) return null

  const current = achievements[currentIndex]
  const hasNext = currentIndex < achievements.length - 1

  const handleNext = () => {
    if (hasNext) {
      setCurrentIndex(i => i + 1)
    } else {
      onDismiss()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      >
        <motion.div
          key={current.key}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-sm rounded-xl bg-white p-6 text-center dark:bg-gray-900"
        >
          <button
            onClick={onDismiss}
            className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>

          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 15 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 text-4xl dark:bg-amber-900/30"
          >
            {current.icon}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Achievement unlocked
            </p>
            <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
              {current.title}
            </h2>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              {current.description}
            </p>
            <div className="mb-5 flex justify-center gap-3">
              <XPBadge xp={current.xpReward} size="lg" />
              <CoinBadge coins={current.coinReward} size="lg" />
            </div>
          </motion.div>

          <Button onClick={handleNext} className="w-full">
            {hasNext ? (
              <>Next Achievement <ChevronRight className="ml-2 h-5 w-5" /></>
            ) : (
              'Continue'
            )}
          </Button>

          {achievements.length > 1 && (
            <p className="mt-3 text-xs text-gray-400">
              {currentIndex + 1} of {achievements.length}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
