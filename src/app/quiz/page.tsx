'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Header, TabBar } from '@/components/layout/navigation'
import { Button } from '@/components/ui/button'
import { OptionButton, QuestionCard, ResultScreen } from '@/components/lessons/lesson-components'
import { AchievementNotification } from '@/components/achievements/achievement-notification'
import { useAchievements } from '@/hooks/use-achievements'
import type { Question } from '@/types'
import { getContent } from '@/lib/content/registry'
import { motion, AnimatePresence } from 'framer-motion'
import { HeartDisplay } from '@/components/ui/badges'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'

function QuizContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [hearts, setHearts] = useState(5)
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro')

  const { checkAndUnlock, newlyUnlocked, dismissNewAchievements } = useAchievements()

  const moduleId = searchParams.get('module') || 'module-1'
  const lessonIndex = parseInt(searchParams.get('lesson') || '0')

  const userCurrency = session?.user?.currency || 'USD'
  const content = getContent(userCurrency)

  const moduleData = content.modules.find((m, i) =>
    `module-${i + 1}` === moduleId
  ) || content.modules[0]

  const lessonData = moduleData.lessons[lessonIndex]
  const questions = (lessonData?.content?.questions || []) as Question[]
  const introduction = lessonData?.content?.introduction
  const summary = lessonData?.content?.summary
  const tips = lessonData?.content?.tips || []

  const checkedRef = useRef(false)
  useEffect(() => {
    if (phase === 'result' && !checkedRef.current) {
      checkedRef.current = true
      const perfect = score === questions.length
      checkAndUnlock({ perfectQuiz: perfect })
    }
  }, [phase, score, questions.length, checkAndUnlock])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  const handleAnswer = useCallback((answer: string) => {
    if (selectedAnswer || showResult) return
    setSelectedAnswer(answer)
    setShowResult(true)
    const question = questions[currentQuestion]
    const isCorrect = answer === question.correctAnswer
    if (isCorrect) {
      setScore(s => s + 1)
    } else {
      setHearts(h => Math.max(0, h - 1))
    }
  }, [selectedAnswer, showResult, questions, currentQuestion])

  const handleNext = useCallback(() => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(c => c + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setPhase('result')
    }
  }, [currentQuestion, questions.length])

  const handleRetry = useCallback(() => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setHearts(5)
    setPhase('intro')
    checkedRef.current = false
  }, [])

  const handleContinue = useCallback(() => {
    router.push('/learn')
  }, [router])

  const startQuiz = useCallback(() => {
    setPhase('playing')
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
      </div>
    )
  }

  if (!session || !lessonData) return null

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Header />
        <main className="pb-20 pt-4">
          <div className="mx-auto max-w-2xl px-4">
            <button onClick={() => router.push('/learn')} className="btn-ghost !px-2 mb-6">
              <ArrowLeft className="h-5 w-5 mr-1" /> Back
            </button>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-green/10">
                  <BookOpen className="h-6 w-6 text-brand-green" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{lessonData.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{lessonData.description}</p>
              </div>

              <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {introduction}
                </p>
              </div>

              {summary && (
                <div className="mb-6 rounded-xl border border-brand-green/20 bg-brand-green/5 p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{summary}</p>
                </div>
              )}

              {tips.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">Pro Tips</h3>
                  <div className="space-y-2">
                    {tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold text-brand-blue">
                          {i + 1}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6 rounded-xl border border-amber-200/50 bg-amber-50 p-3 dark:border-amber-800/30 dark:bg-amber-950/30">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>{questions.length} questions</strong> to test what you have learned.
                </p>
              </div>

              <Button onClick={startQuiz} className="w-full">
                Start Quiz <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </main>
        <TabBar />
      </div>
    )
  }

  if (phase === 'result') {
    const perfectLesson = score === questions.length
    const xpEarned = score * 10 + (perfectLesson ? 25 : 0)
    const coinsEarned = score * 5
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Header />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 pb-20">
          <ResultScreen score={score} maxScore={questions.length} xpEarned={xpEarned} coinsEarned={coinsEarned} perfectLesson={perfectLesson} onRetry={handleRetry} onNext={handleContinue} />
        </main>
        <TabBar />
        {newlyUnlocked.length > 0 && (
          <AchievementNotification achievements={newlyUnlocked} onDismiss={dismissNewAchievements} />
        )}
      </div>
    )
  }

  const question = questions[currentQuestion]
  if (!question) return null

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <main className="pb-20 pt-4">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <button onClick={() => router.push('/learn')} className="btn-ghost !px-2">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <HeartDisplay hearts={hearts} maxHearts={5} />
          </div>
          <AnimatePresence mode="wait">
            <QuestionCard key={question.id} question={question.question} hint={question.hint} progress={currentQuestion + 1} total={questions.length}>
              {question.options?.map((option, index) => (
                <OptionButton
                  key={index} label={option} index={index}
                  isSelected={selectedAnswer === option}
                  isCorrect={showResult && option === question.correctAnswer}
                  isWrong={showResult && selectedAnswer === option && option !== question.correctAnswer}
                  disabled={showResult} onClick={() => handleAnswer(option)}
                />
              ))}
              {showResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 rounded-xl p-4 ${selectedAnswer === question.correctAnswer ? 'bg-brand-green/10 border border-brand-green/20' : 'bg-brand-red/10 border border-brand-red/20'}`}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedAnswer === question.correctAnswer ? 'Correct' : 'Not quite'}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{question.explanation}</p>
                </motion.div>
              )}
            </QuestionCard>
          </AnimatePresence>
          {showResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-100 p-4 dark:bg-gray-950 dark:border-gray-800 lg:bottom-0 lg:relative lg:border-none lg:bg-transparent lg:p-0 lg:mt-6"
            >
              <div className="mx-auto max-w-2xl">
                <Button onClick={handleNext} className="w-full">
                  {currentQuestion < questions.length - 1 ? <>Next <ArrowRight className="ml-2 h-5 w-5" /></> : 'See Results'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <TabBar />
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}
