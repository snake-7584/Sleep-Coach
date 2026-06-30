'use client'

import { useState, useEffect, useCallback } from 'react'
import { GamificationEngine } from '@/lib/gamification'
import type { Achievement } from '@/types'

interface AchievementCheckStats {
  perfectQuiz?: boolean
}

interface ModuleWithLessons {
  id: string
  title: string
  lessons: { id: string }[]
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([])

  const fetchAchievements = useCallback(async () => {
    try {
      const res = await fetch('/api/achievements')
      if (res.ok) {
        const data = await res.json() as Achievement[]
        setAchievements(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAchievements()
  }, [fetchAchievements])

  const dismissNewAchievements = useCallback(() => {
    setNewlyUnlocked([])
  }, [])

  const checkAndUnlock = useCallback(async (stats?: AchievementCheckStats) => {
    try {
      const [userRes, progressRes, modulesRes] = await Promise.all([
        fetch('/api/user'),
        fetch('/api/progress'),
        fetch('/api/lessons'),
      ])

      if (!userRes.ok || !progressRes.ok || !modulesRes.ok) return []

      const user = await userRes.json() as { xp: number; streakCount: number }
      const progress = await progressRes.json() as { completed: boolean; lesson?: { moduleId: string } }[]
      const modules: ModuleWithLessons[] = await modulesRes.json()

      const lessonsCompleted = progress.filter((p) => p.completed).length

      const moduleLessonCounts: Record<string, number> = {}
      const moduleTitles: Record<string, string> = {}
      for (const mod of modules) {
        moduleLessonCounts[mod.id] = mod.lessons.length
        moduleTitles[mod.id] = mod.title
      }

      const completedModuleTitles: string[] = []
      let allModulesCompleted = true

      for (const mod of modules) {
        const completedCount = progress.filter(
          (p) => p.completed && p.lesson?.moduleId === mod.id
        ).length

        const isComplete = completedCount >= mod.lessons.length
        if (isComplete) {
          completedModuleTitles.push(mod.title)
        } else {
          allModulesCompleted = false
        }
      }

      const xp = user.xp ?? 0
      const streak = user.streakCount ?? 0

      const newKeys = GamificationEngine.checkAchievements({
        xp,
        streak,
        lessonsCompleted,
        perfectQuiz: stats?.perfectQuiz ?? false,
        completedModuleTitles,
        allModulesCompleted,
      })

      const alreadyUnlockedKeys = new Set(
        achievements.filter(a => a.unlocked).map(a => a.key)
      )

      const toUnlock = newKeys.filter(key => !alreadyUnlockedKeys.has(key))

      if (toUnlock.length === 0) return []

      const unlocked: Achievement[] = []

      for (const key of toUnlock) {
        const res = await fetch('/api/achievements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
        if (res.ok) {
          const ach = achievements.find(a => a.key === key)
          if (ach) {
            unlocked.push({ ...ach, unlocked: true, unlockedAt: new Date().toISOString() })
          }
        }
      }

      if (unlocked.length > 0) {
        setNewlyUnlocked(unlocked)
        fetchAchievements()
      }

      return unlocked
    } catch {
      return []
    }
  }, [achievements, fetchAchievements])

  return {
    achievements,
    loading,
    newlyUnlocked,
    checkAndUnlock,
    dismissNewAchievements,
    refresh: fetchAchievements,
  }
}
