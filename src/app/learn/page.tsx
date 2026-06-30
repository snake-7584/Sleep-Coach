'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Header, DesktopSidebar, TabBar } from '@/components/layout/navigation'
import { Card } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress'
import { XPBadge } from '@/components/ui/badges'
import { getContent } from '@/lib/content/registry'
import Link from 'next/link'
import { Lock, ChevronRight, CheckCircle } from 'lucide-react'

interface ProgressEntry {
  lessonId: string
  completed: boolean
  score: number
  lesson: {
    id: string
    title: string
    moduleId: string
    order: number
  }
}

const gradientColors = [
  'from-emerald-400 to-brand-green',
  'from-blue-400 to-brand-blue',
  'from-purple-400 to-brand-purple',
  'from-orange-400 to-brand-orange',
  'from-red-400 to-brand-red',
  'from-green-400 to-green-500',
  'from-purple-400 to-purple-600',
]

const fallbackModules = [
  {
    id: 'module-5',
    title: 'Investing',
    description: 'Start your investment journey',
    icon: '📈',
    color: 'from-red-400 to-brand-red',
    lessons: [
      { title: 'Stocks', type: 'multiple_choice', xp: 25 },
      { title: 'Risk vs Reward', type: 'scenario', xp: 25 },
    ],
    xpReward: 75,
  },
  {
    id: 'module-6',
    title: 'Taxes',
    description: 'Tax basics for beginners',
    icon: '🧾',
    color: 'from-green-400 to-green-500',
    lessons: [
      { title: 'Basic Taxes', type: 'multiple_choice', xp: 20 },
    ],
    xpReward: 50,
  },
  {
    id: 'module-7',
    title: 'Advanced Finance',
    description: 'Retirement, real estate, and wealth building',
    icon: '🚀',
    color: 'from-purple-400 to-purple-600',
    lessons: [
      { title: 'Retirement Accounts', type: 'multiple_choice', xp: 30 },
      { title: 'Wealth Building', type: 'multiple_choice', xp: 35 },
    ],
    xpReward: 100,
  },
]

function buildModules(currency: string) {
  const content = getContent(currency)
  const mapped = content.modules.map((mod, i) => ({
    id: `module-${i + 1}`,
    title: mod.title,
    description: mod.description,
    icon: mod.icon,
    color: gradientColors[i] || 'from-gray-400 to-gray-500',
    lessons: mod.lessons.map(l => ({
      title: l.title,
      type: l.lessonType,
      xp: l.xpReward,
    })),
    xpReward: mod.xpReward,
  }))
  return [...mapped, ...fallbackModules]
}

export default function LearnPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [progress, setProgress] = useState<ProgressEntry[]>([])
  const [loadingProgress, setLoadingProgress] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch('/api/progress')
        if (res.ok) {
          const data = await res.json() as ProgressEntry[]
          setProgress(data)
        }
      } catch {
        // fallback to no progress
      } finally {
        setLoadingProgress(false)
      }
    }
    if (session) fetchProgress()
  }, [session])

  if (status === 'loading' || loadingProgress) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
      </div>
    )
  }

  if (!session) return null

  const modules = buildModules(session?.user?.currency || 'USD')

  const completedLessonTitles = new Set(
    progress.filter(p => p.completed).map(p => p.lesson.title)
  )

  function isLessonLocked(modIndex: number, lessonIndex: number): boolean {
    if (modIndex === 0 && lessonIndex === 0) return false

    if (lessonIndex === 0) {
      const prevModule = modules[modIndex - 1]
      const allPrevCompleted = prevModule.lessons.every(l => completedLessonTitles.has(l.title))
      return !allPrevCompleted
    }

    const prevLesson = modules[modIndex].lessons[lessonIndex - 1]
    return !completedLessonTitles.has(prevLesson.title)
  }

  function isModuleLocked(modIndex: number): boolean {
    if (modIndex === 0) return false
    const prevModule = modules[modIndex - 1]
    return !prevModule.lessons.every(l => completedLessonTitles.has(l.title))
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <div className="flex">
        <DesktopSidebar />
        <main className="flex-1 pb-20 pt-4 lg:pb-6">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learning Path</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Complete each lesson to unlock the next one. Finish all lessons in a module to unlock the next module.
            </p>
          </div>

          {progress.length === 0 && (
            <Card className="mb-6 border-brand-green/20 bg-brand-green/5 p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Start with <strong>Module 1: Money Basics</strong> below. Complete each lesson to unlock the next.
              </p>
            </Card>
          )}

          <div className="space-y-6">
            {modules.map((mod, modIndex) => {
              const moduleLocked = isModuleLocked(modIndex)
              const completedCount = mod.lessons.filter(l => completedLessonTitles.has(l.title)).length

              return (
                <div key={mod.id} className="relative">
                  {modIndex < modules.length - 1 && (
                    <div className={`absolute left-8 top-20 bottom-0 w-0.5 ${
                      completedCount === mod.lessons.length ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}

                  <Card className={`relative ${moduleLocked ? 'opacity-50' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl ${
                          moduleLocked ? 'bg-gray-200 dark:bg-gray-700' : 'bg-brand-green/10'
                        }`}
                      >
                        {moduleLocked ? <Lock className="h-6 w-6 text-white" /> : mod.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h2 className={`text-xl font-bold ${
                              moduleLocked ? 'text-gray-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              {mod.title}
                            </h2>
                            {completedCount === mod.lessons.length && !moduleLocked && (
                              <CheckCircle className="h-5 w-5 text-brand-green shrink-0" />
                            )}
                          </div>
                          <span className="xp-pill shrink-0">+{mod.xpReward} XP</span>
                        </div>

                        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{mod.description}</p>

                        <div className="mb-3">
                          <ProgressBar value={completedCount} max={mod.lessons.length} size="sm" />
                          <p className="mt-1 text-xs text-gray-400">
                            {completedCount}/{mod.lessons.length} lessons
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          {mod.lessons.map((lesson, lIndex) => {
                            const done = completedLessonTitles.has(lesson.title)
                            const locked = moduleLocked || isLessonLocked(modIndex, lIndex)

                            return (
                              <Link
                                key={lIndex}
                                href={locked ? '#' : `/quiz?module=${mod.id}&lesson=${lIndex}`}
                                className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                                  locked
                                    ? 'cursor-not-allowed opacity-50'
                                    : done
                                    ? 'bg-brand-green/5 hover:bg-brand-green/10'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                }`}
                              >
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                    locked
                                      ? 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                                      : done
                                      ? 'bg-brand-green/20 text-brand-green'
                                      : lesson.type === 'fill_blank'
                                      ? 'bg-brand-blue/10 text-brand-blue'
                                      : lesson.type === 'match_terms'
                                      ? 'bg-brand-purple/10 text-brand-purple'
                                      : lesson.type === 'scenario'
                                      ? 'bg-brand-orange/10 text-brand-orange'
                                      : 'bg-brand-green/10 text-brand-green'
                                  }`}
                                >
                                  {locked ? <Lock className="h-3.5 w-3.5" /> : done ? <CheckCircle className="h-4 w-4" /> : lesson.type === 'fill_blank' ? '✍️' : lesson.type === 'match_terms' ? '🔗' : lesson.type === 'scenario' ? '🎯' : '📝'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <span className={`text-sm font-medium ${
                                    locked
                                      ? 'text-gray-400'
                                      : done
                                      ? 'text-brand-green'
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {lesson.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {done && (
                                    <XPBadge xp={lesson.xp} size="sm" />
                                  )}
                                  {!locked && !done && (
                                    <span className="text-xs text-gray-400">+{lesson.xp} XP</span>
                                  )}
                                  {!locked && <ChevronRight className={`h-4 w-4 ${done ? 'text-brand-green' : 'text-gray-400'}`} />}
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </main>
      </div>
      <TabBar />
    </div>
  )
}
